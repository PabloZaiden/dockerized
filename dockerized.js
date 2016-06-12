#!/usr/bin/env node
"use strict";
const nconf = require('nconf');
const Fs = require('fs');
const OS = require('os');
const Path = require('path');
const Process = require('child_process');
class App {
    static main(args) {
        App.loadUserData();
        let add = App.config.get('add');
        let command = App.config.get('command');
        let del = App.config.get('delete');
        if (App.isInput(add)) {
            if (App.isInput(command)) {
                App.addEntry(add, command);
                App.saveUserData();
                console.log(`${add} was added`);
            }
            else {
                App.printHelp();
            }
        }
        else if (App.isInput(del)) {
            App.deleteEntry(del);
            App.saveUserData();
            console.log(`${del} was deleted`);
        }
        else if (args.length > 0) {
            let name = args[0];
            let command = App.getCommand(name);
            if (command == undefined) {
                console.error(`Command ${name} does not exist`);
                return;
            }
            let commandArgs = ['run', '--rm', '-ti', command].concat(args.slice(1));
            let dockerProcess = Process.spawn('docker', commandArgs, { stdio: 'inherit' });
        }
        else {
            App.printAllEntries();
            App.printHelp();
        }
    }
    static deleteEntry(name) {
        for (let i = 0; i < App.userData.entries.length; i++) {
            if (App.userData.entries[i].name == name) {
                App.userData.entries.splice(i, 1);
                return;
            }
        }
    }
    static addEntry(name, command) {
        App.deleteEntry(name);
        App.userData.entries.push({ name: name, command: command });
    }
    static getCommand(name) {
        for (let entry of App.userData.entries) {
            if (entry.name == name) {
                return entry.command;
            }
        }
        return undefined;
    }
    static isInput(data) {
        return data != undefined && data != true;
    }
    static printAllEntries() {
        console.log('Available entries: ');
        for (let entry of App.userData.entries) {
            console.log(`   -${entry.name}: ${entry.command}`);
        }
        console.log('');
    }
    static printHelp() {
        console.log('usage:');
        console.log('   dockerized <name>');
        console.log('   dockerized --add <name> --command <command>');
        console.log('   dockerized --delete <name>');
    }
    static loadUserData() {
        if (!App.fileExists(App.userDataFileName)) {
            Fs.writeFileSync(App.userDataFileName, JSON.stringify(App.userData), { encoding: App.encoding });
        }
        else {
            let content = Fs.readFileSync(App.userDataFileName, App.encoding);
            App.userData = JSON.parse(content);
        }
    }
    static saveUserData() {
        Fs.writeFileSync(App.userDataFileName, JSON.stringify(App.userData));
    }
    static fileExists(file) {
        try {
            let stat = Fs.lstatSync(file);
            return true;
        }
        catch (err) {
            return false;
        }
    }
}
App.config = nconf.argv();
App.encoding = 'utf8';
App.userDataFileName = Path.join(OS.homedir(), '.dockerized');
App.userData = {
    entries: [
        {
            name: 'sample',
            command: 'hello-world'
        }
    ]
};
exports.App = App;
App.main(process.argv.slice(2));
//# sourceMappingURL=dockerized.js.map