# user-appointment-be-nodejsexpress

This is project to make user appointment using nodejs with express as back end

## Requirement

- [Node.js](https://nodejs.org/) v20 or newer.
- [Npm] v11

## Features
- [Express.js]
- [JWT] JSON Web Token
- [Moment.js]
- [PostgreSQL]
- [Prisma]

## Directory Structure

| Name                              | Description |
| --------------------------------- | ----------- |
| **node_modules/**                 | Dependencies File to Support the Code. |
| **public/**                       | Static assets (fonts, css, js, img). |
| **controllers/**                  | Source files of Controller |
| **middleware**                    | Source files of Middleware for Auth. |
| **prisma**                        | Source files of prisma for database and migration. |
| **routes**                        | Application routes. |


## Installation
1.  Ensure you have the following installed on your system: 
    - Node.js (v20)
    - postgresql

2. Clone the repo 
    - `git clone https://github.com/henrysetiadi/user-appointment-be-nodejsexpress.git`.
    - `cd user-appointment-be-nodejsexpress`

3.  Install project dependencies 
    - `npm install`.

4. Setup Database
    - Start postgresql and create the database manually
      `CREATE DATABASE user_appoint_mgt_STG`

    - Create `.env` file - `cp .env.example .env`.
    - Update the .env file the database connection URL:
      `DATABASE_URL="postgresql://postgres:admin@localhost:5432/user_appoint_mgt_STG`

5. Run Database Migration
    `npx prisma migrate dev --name init`

6. Launch the app — `node server.js`, it will become available at [http://localhost:5000](http://localhost:5000/).


