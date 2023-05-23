![example event parameter](https://github.com/DAT2G7/grid-project/actions/workflows/build.yml/badge.svg?event=push)
![example event parameter](https://github.com/DAT2G7/grid-project/actions/workflows/jest.yml/badge.svg?event=push)

# grid-project

This repository contains the `grid-project` code accompanying AAU cs-23-DAT-2-07's P2 report

This server is responsible for registering jobs with the grid, as well as serving task data to clients, proxied through the grid server.

## Setup

Clone repository

```sh
git clone https://github.com/DAT2G7/grid-project
```

Install dependencies

```sh
npm install
```

Build project

```sh
npm run build
```

Start builded project

```sh
npm run start
```

While developing, the project can be run in watch mode, automatically re-compiling after changes. This is done with the watch command:

```sh
npm run watch
```

Configuration is done with `.env` files. A `.env.example` file has been supplied.
