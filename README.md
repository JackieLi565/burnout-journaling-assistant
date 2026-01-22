# Burnout journaling Assistant

## Getting Started

Ensure you have the following dependencies installed:

- [Node.js 18.8](https://nodejs.org/en) or later
- [Docker](https://www.docker.com/)
- [Terraform](https://developer.hashicorp.com/terraform)

Not required but the following does help:

- [direnv](https://direnv.net/)
- [migrate](https://github.com/golang-migrate/migrate)

Clone the repository.

```sh
git clone https://github.com/JackieLi565/burnout-journaling-assistant.git
```

Start the Firebase Local Emulator (required for backend).

```sh
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Start the emulator (choose one method):
# Option 1: Using npm script
npm run firebase:emulator

# Option 2: Using provided scripts
# Linux/Mac: ./scripts/start-firebase-emulator.sh
# Windows: .\scripts\start-firebase-emulator.ps1

# Option 3: Direct command
firebase emulators:start --only firestore
```

The emulator will be available at:
- Firestore: `localhost:8080`
- Emulator UI: `http://localhost:4000`

Emulate cloud services locally via Terraform.

```sh
cd terraform

terraform apply
```

Start app in development environment.

```sh
npm run dev
```
