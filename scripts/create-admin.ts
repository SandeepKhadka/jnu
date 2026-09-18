/**
 * Creates (or resets) an administrator account from the command line.
 *
 *   npm run admin:create -- --email you@university.in --name "Your Name"
 *
 * The password is asked for interactively and never echoed, so it does not
 * end up in shell history or a process list. For automated setup it may come
 * from the ADMIN_PASSWORD environment variable instead.
 *
 * This is the ONLY way an account is created without an existing admin: there
 * are no default or demo credentials anywhere in the project. Every further
 * account is created from the admin panel (Staff), with a temporary password
 * the new user must change at first sign-in.
 *
 * Running it again for an existing email resets that account's password,
 * makes it an administrator and re-enables it — the recovery path if the only
 * admin is locked out.
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
import { createInterface } from 'node:readline'

import { MIN_STAFF_PASSWORD } from '../src/lib/permissions'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

/** Reads a line without echoing it to the terminal. */
function askHidden(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true })
    const out = rl as unknown as { _writeToOutput: (s: string) => void; output: NodeJS.WriteStream }
    let muted = false
    out._writeToOutput = (s: string) => {
      if (!muted) out.output.write(s)
    }
    rl.question(prompt, (answer) => {
      rl.close()
      process.stdout.write('\n')
      resolve(answer)
    })
    muted = true
  })
}

async function main() {
  const email = arg('email')?.trim().toLowerCase()
  const name = arg('name')?.trim()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !name) {
    console.error('Usage: npm run admin:create -- --email you@university.in --name "Your Name"')
    process.exit(1)
  }

  let password = process.env.ADMIN_PASSWORD ?? ''
  if (!password) {
    if (!process.stdin.isTTY) {
      console.error('No terminal to ask for a password. Set ADMIN_PASSWORD for non-interactive use.')
      process.exit(1)
    }
    password = await askHidden(`Password for ${email} (min ${MIN_STAFF_PASSWORD} characters): `)
    const again = await askHidden('Repeat password: ')
    if (password !== again) {
      console.error('Passwords do not match.')
      process.exit(1)
    }
  }
  if (password.length < MIN_STAFF_PASSWORD) {
    console.error(`Password must be at least ${MIN_STAFF_PASSWORD} characters.`)
    process.exit(1)
  }

  const db = new PrismaClient()
  try {
    const passwordHash = await bcrypt.hash(password, 12)
    const existing = await db.staff.findUnique({ where: { email } })
    const row = await db.staff.upsert({
      where: { email },
      update: { fullName: name, role: 'admin', passwordHash, disabled: false, mustChangePassword: false },
      create: { email, fullName: name, role: 'admin', passwordHash },
    })
    await db.auditLog.create({
      data: {
        actorId: row.id,
        actorEmail: email,
        action: existing ? 'staff.reset-cli' : 'staff.create-cli',
        detail: `${existing ? 'Reset' : 'Created'} administrator ${email} from the command line`,
      },
    })
    console.log(`${existing ? 'Reset' : 'Created'} administrator ${email}. Sign in at /admin/login/`)
  } finally {
    await db.$disconnect()
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
