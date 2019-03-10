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
GOTO: https://nodejs.org/en/download/ - Download and install (LTS or Current)
```

Install Electron globally:

```
npm install electron -g
```

#### Clone the repository
Navigate to the desired directory and perform:

```
git clone https://bitbucket.org/team_amadeus/mab_electron.git
```

Once node.js & electron have been installed, navigate to the newly cloned repository and perform the following commands:

```
npm install konva
npm install timer-stopwatch
npm install js-yaml
```

## Running MAB

To run MAB, in your Terminal/PowerShell/Command Prompt, navigate to your cloned repository and run:

```
npm start
```

Future iterations will run via a platform specific executable.

## Built With

* [Node.js](https://nodejs.org/en/) - An asynchronous event driven JavaScript runtime
* [Electron](https://electronjs.org/) - Electron is an open source library developed by GitHub for building cross-platform desktop applications with HTML, CSS, and JavaScript.
* [Konva](https://rometools.github.io/rome/) - An HTML5 Canvas JavaScript framework that extends the 2d context
by enabling canvas interactivity for desktop and mobile applications.
* [Timer-Stopwatch](https://www.npmjs.com/package/timer-stopwatch) - A stopwatch and countdown clock module for node.js.
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
