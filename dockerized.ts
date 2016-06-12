#!/usr/bin/env node

import nconf = require('nconf');
import * as Fs from 'fs';
import * as OS from 'os';
import * as Path from 'path';
import * as Process from 'child_process';


export class App {
    private static config = nconf.argv();

    private static encoding = 'utf8';
    private static userDataFileName = Path.join(OS.homedir(), '.dockerized');
    private static userData = {
        entries: [
            {
                name: 'sample',
                command: 'hello-world'
            }
        ]
    };

    static main(args: string[]) {
        App.loadUserData();

        let add = App.config.get('add');
        let command = App.config.get('command');
        let del = App.config.get('delete');

        if (App.isInput(add)) {
            if (App.isInput(command)) {
                App.addEntry(add, command);
                App.saveUserData();
                console.log(`${add} was added`);
            } else {
                App.printHelp();
            }
        } else if (App.isInput(del)) {
            App.deleteEntry(del);
            App.saveUserData();
            console.log(`${del} was deleted`);
        
        } else if (args.length > 0) {
            let name = args[0];
            let command = App.getCommand(name);

            if (command == undefined) {
                console.error(`Command ${name} does not exist`);
                return;
            }

            let commandArgs = ['run', '--rm', '-ti', command].concat(args.slice(1));
            
            let dockerProcess = Process.spawn('docker', commandArgs, {stdio: 'inherit'});  
        } else {
            App.printAllEntries();
            App.printHelp();
        }
    }

    private static deleteEntry(name: string): void {
        for (let i = 0; i < App.userData.entries.length; i++) {
            if (App.userData.entries[i].name == name) {
                App.userData.entries.splice(i, 1);
                return;
            }
        }
    }

    private static addEntry(name: string, command: string): void {
        App.deleteEntry(name);
        App.userData.entries.push({ name: name, command: command });
    }

    private static getCommand(name: string): string {
        for (let entry of App.userData.entries) {
            if (entry.name == name) {
                return entry.command;
            }
        }

        return undefined;
    }

    private static isInput(data: any) {
        return data != undefined && data != true;
    }

    private static printAllEntries(): void {
        console.log('Available entries: ');

        for (let entry of App.userData.entries) {
            console.log(`   -${entry.name}: ${entry.command}`);
        }
        console.log('');
    }

    private static printHelp(): void {
        console.log('usage:');
        console.log('   dockerized <name>');
        console.log('   dockerized --add <name> --command <command>');
        console.log('   dockerized --delete <name>');
    }

    private static loadUserData(): void {
        if (!App.fileExists(App.userDataFileName)) {
            Fs.writeFileSync(App.userDataFileName, JSON.stringify(App.userData), { encoding: App.encoding });
        } else {
            let content = Fs.readFileSync(App.userDataFileName, App.encoding);
            App.userData = JSON.parse(content);
        }
    }

    private static saveUserData(): void {
        Fs.writeFileSync(App.userDataFileName, JSON.stringify(App.userData));
    }

    private static fileExists(file: string): boolean {
        try {
            let stat = Fs.lstatSync(file);
            return true;
        } catch (err) {
            return false;
        }
    }
}

App.main(process.argv.slice(2));