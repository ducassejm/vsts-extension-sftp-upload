import Q = require('q');
import os = require("os");

function writeLine(message:string){
    process.stdout.write(message + os.EOL);
}

export class RemoteCommandOptions {
    public failOnStdErr : boolean;
}

export class SshHelper {
    private sshConfig: any;
    
    /**
     * Constructor that takes a configuration object of format
     * {
            host: hostname,
            port: port,
            username: username,
            privateKey: privateKey,
            passphrase: passphrase
       }
     * @param sshConfig
     */
    constructor(sshConfig: any) {
        this.sshConfig = sshConfig;
    }


    /**
     * Sets up the SSH connection
     */
    async setupConnection() {
        writeLine("mock setupConnection");
        var defer = Q.defer<void>();
        defer.resolve();
        return defer.promise;
    }

    /**
     * Close any open client connections for SSH, SCP and SFTP
     */
    closeConnection() { 
        writeLine("mock closeConnection");    
    }

    /**
     * Uploads a file to the remote server
     * @param sourceFile
     * @param dest, folders will be created if they do not exist on remote server
     * @returns {Promise<string>}
     */
    uploadFile(sourceFile: string, dest: string) : Q.Promise<string> {
        writeLine(`mock uploadFile: ${dest}`)  
        var defer = Q.defer<string>();
        defer.resolve(dest);
        return defer.promise;
    }

    /**
     * Returns true if the path exists on remote machine, false if it does not exist
     * @param path
     * @returns {Promise<boolean>}
     */
    checkRemotePathExists(path: string) : Q.Promise<boolean> {
        writeLine(`mock checkRemotePathExists: ${path}`)  
        
        var defer = Q.defer<boolean>();
        defer.resolve(false);
        
        return defer.promise;
    }

    /**
     * Runs specified command on remote machine, returns error for non-zero exit code
     * @param command
     * @param options
     * @returns {Promise<string>}
     */
    runCommandOnRemoteMachine(command: string, options: RemoteCommandOptions) : Q.Promise<string> {
        writeLine(`mock runCommandOnRemoteMachine: ${command}`)  
        var defer = Q.defer<string>();
        defer.resolve('0');
        return defer.promise;
    }
}
