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

Setup a local database via Docker.

```sh
docker compose up
```

Emulate cloud services locally via Terraform.

```sh
cd terraform

terraform apply
```

Start app in development environment.

```sh
npm run dev
```
