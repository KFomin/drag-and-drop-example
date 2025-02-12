# Prerequisites

Before starting the project, make sure you have installed the following programs:

- **Node.js**: This is a JavaScript runtime for executing code on the server.
- **npm (Node Package Manager)**: A package manager for installing libraries, including Angular CLI.

## Installing Node.js and npm

1. Open the terminal and enter the following commands:

    ```bash
    sudo apt update
    sudo apt install nodejs npm
    ```

2. After installation, check the versions of Node.js and npm:

    ```bash
    node -v
    npm -v
    ```

## Installing Angular CLI

Angular CLI simplifies the process of creating, developing, and running Angular applications.

1. Install Angular CLI globally:

    ```bash
    sudo npm install -g @angular/cli
    ```

2. Verify the installation of Angular CLI:

    ```bash
    ng version
    ```

## Cloning the repository

1. Clone project repository:

    ```bash
    git clone https://github.com/KFomin/drag-and-drop-example.git
    ```

2. Navigate to project directory:

    ```bash
    cd drag-and-drop-example
    ```

## Installing dependencies

Install the required dependencies using npm. This will create a `node_modules` folder in your project directory where all dependencies will be stored:

```bash
npm install
```

## Starting the project

After installing all dependencies, start the project:

```bash
ng serve
```

By default, the app will be available at [http://localhost:4200](http://localhost:4200). Open this address in your browser.
