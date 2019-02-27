# MAB (MAD Assembly Builder)

Software deployment is an integral part of modern software development, but it can be inefficient to program. Many tools seek to make the process more efficient, but the Madeus model uniquely leverages parallelism to improve the efficiency of the deployment process more than its competitors. However, Madeus and its Python implementation MAD are complex to code by hand, making it challenging to use.

Our software, the MAD Assembly Builder (MAB) is a tool used to build, simulate, and generate code for software deployment using the Madeus model. This will improve the speed of building the assemblies used for software deployment and lead to the model’s increased deployment efficiency becoming more readily accessible. Additionally, MAB is extensible through a plugin framework that will allow the application to change and evolve as the needs of the user and the Madeus model itself change over time.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

```
Node.js
Electron
Konva
JS-YAML
```

### Installing

Install node.js

```
GOTO: https://nodejs.org/en/download/ - Download and install
```

Install Electron, Konva, and JS-YAML:

Once node.js has been installed, perform the following commands in your Terminal/PowerShell/Command Prompt ("-g" will perform a global installation of the package). If you do not want a global installation, clone the repository first, and then perform the following commands in the newly created directory without the "-g" flag.

```
npm install electron -g
npm install konva-node -g
npm install js-yaml -g
```

### Cloning the repository

Navigate to the desired directory, perform:

```
git clone https://bitbucket.org/team_amadeus/mab_electron.git
```

## Runnin MAB

To run MAB, in your Terminal/PowerShell/Command Prompt, navigate to your newly cloned repository and run:

```
npm start
```

Future iterations will run via a platform specific executable.

## Built With

* [Node.js](https://nodejs.org/en/) - An asynchronous event driven JavaScript runtime
* [Electron](https://electronjs.org/) - Electron is an open source library developed by GitHub for building cross-platform desktop applications with HTML, CSS, and JavaScript.
* [Konva](https://rometools.github.io/rome/) - An HTML5 Canvas JavaScript framework that extends the 2d context
by enabling canvas interactivity for desktop and mobile applications.
* [JS-YAML](https://github.com/nodeca/js-yaml) - An implementation of YAML, a human-friendly data serialization language.

## Authors

* **Wyatt Evans**
* **Kyle Krueger**
* **Melody Pressley**
* **Evan Russell**

## License

TBD

## Acknowledgments

* Dr. Frédéric Loulergue - NAU - SICCS
* Dr. Hélène Coullon - IMT Atlantique
* Austin Sanders - NAU - Graduate Mentor
