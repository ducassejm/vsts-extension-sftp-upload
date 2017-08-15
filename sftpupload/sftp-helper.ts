import Q = require('q');
import tl = require('vsts-task-lib/task');
import pt = require('path');
import ssh2Streams = require('ssh2-streams');
import ssh2 = require('ssh2');


var sftpStatusCode = ssh2.SFTP_STATUS_CODE;
var Scp2Client = require('scp2').Client;

export class RemoteCommandOptions {
    public failOnStdErr: boolean;
}

export class SftpHelper {
    private sshConfig: any;
    private sshClient: ssh2.Client;
    private scpClient: any;
    private sftpClient: ssh2.SFTPWrapper;

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

    private setupSshClientConnection(): Q.Promise<void> {
        var defer = Q.defer<void>();
        this.sshClient = new ssh2.Client();
        this.sshClient.on('ready', () => {
            this.sshClient.sftp((err, sftp) => {
                if (err) {
                    defer.reject(tl.loc('ConnectionFailed', err));
                } else {
                    this.sftpClient = sftp;
                    defer.resolve(null);
                }
            })
        }).on('error', (err) => {
            defer.reject(tl.loc('ConnectionFailed', err));
        }).connect(this.sshConfig);
        return defer.promise;
    }

    private setupScpConnection(): Q.Promise<void> {
        var defer = Q.defer<void>();
        this.scpClient = new Scp2Client();
        this.scpClient.defaults(this.sshConfig);
        defer.resolve(null);
        return defer.promise;
    }

    /**
     * Sets up the SSH connection
     */
    async setupConnection() {
        console.log(tl.loc('SettingUpSSHConnection', this.sshConfig.host));
        try {
            await this.setupSshClientConnection();
            await this.setupScpConnection();
        } catch (err) {
            throw tl.loc('ConnectionFailed', err);
        }
    }

    /**
     * Close any open client connections for SSH, SCP and SFTP
     */
    closeConnection() {
        try {
            if (this.sshClient) {
                this.sshClient.end();
                this.sshClient = null;
            }
        } catch (err) {
            tl.debug('Failed to close SSH client.');
        }

        try {
            if (this.scpClient) {
                this.scpClient.close();
                this.scpClient = null;
            }
        } catch (err) {
            tl.debug('Failed to close SCP client.');
        }

        try {
            if (this.sftpClient) {
                this.sftpClient.end();
                this.sftpClient = null;
            }
        } catch (err) {
             tl.debug('Failed to close SCP client.');
            this.sftpClient = null;
        }
    }

    /**
     * Uploads a file to the remote server
     * @param sourceFile
     * @param dest, folders will be created if they do not exist on remote server
     * @returns {Promise<string>}
     */
    uploadFile(sourceFile: string, dest: string): Q.Promise<string> {
        tl.debug('Upload ' + sourceFile + ' to ' + dest + ' on remote machine.');
        var defer = Q.defer<string>();
        if (!this.scpClient) {
            defer.reject(tl.loc('ConnectionNotSetup'));
        }
        this.scpClient.upload(sourceFile, dest, (err) => {
            if (err) {
                defer.reject(tl.loc('UploadFileFailed', sourceFile, dest, err));
            } else {
                defer.resolve(dest);
            }
        })
        return defer.promise;
    }

    /**
     * Returns true if the path exists on remote machine, false if it does not exist
     * @param path
     * @returns {Promise<boolean>}
     */
    checkRemotePathExists(path: string): Q.Promise<boolean> {
        var defer = Q.defer<boolean>();

        if (!this.sftpClient) {
            defer.reject(tl.loc('ConnectionNotSetup'));
        }
        this.sftpClient.stat(path, function (err, attr) {
            if (err) {
                //path does not exist
                defer.resolve(false);
            } else {
                //path exists
                defer.resolve(true);
            }
        })

        return defer.promise;
    }
    
    rmdir(path: string): Q.Promise<void> {
        var defer = Q.defer<void>();

        if (!this.sftpClient) {
            defer.reject(tl.loc('ConnectionNotSetup'));
        }
        this.sftpClient.rmdir(path, function (err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(null);
            }
        })

        return defer.promise;
    }

    unlink(path: string): Q.Promise<void> {
        var defer = Q.defer<void>();

        if (!this.sftpClient) {
            defer.reject(tl.loc('ConnectionNotSetup'));
        }
        this.sftpClient.unlink(path, function (err) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(null);
            }
        })

        return defer.promise;
    }


    readir(path: string): Q.Promise<any> {
        var defer = Q.defer<any>();

        if (!this.sftpClient) {
            defer.reject(tl.loc('ConnectionNotSetup'));
        }
        this.sftpClient.readdir(path, function (err, files) {
            if (err) {
                defer.reject(err);
            } else {
                defer.resolve(files);
            }
        })

        return defer.promise;
    }

    isDirectory(p: string): Q.Promise<boolean> {
        var defer = Q.defer<boolean>();

        if (!this.sftpClient) {
            defer.reject(tl.loc('ConnectionNotSetup'));
        }
        this.sftpClient.lstat(p, function (err, attr) {
            if (err) {
                defer.resolve(false);
            } else {
                if (attr.isDirectory()) {
                    defer.resolve(true);
                } else {
                    defer.resolve(false);
                }
            }
        })

        return defer.promise;
    }

    async removeDirectory(startDir: string) {

        let directories: string[] = [startDir];
        let nonEmptyDirectories: string[] = [];

        while (directories.length > 0) {
            let directory = directories.pop();

            let fileEntries = [];

            try {
                fileEntries = await this.readir(directory);
                tl.debug(`readir ${directory}`);
            } catch (reason) {
                tl.debug(`${reason}: ${directory}`);
            }

            if (fileEntries.length > 0) {
                nonEmptyDirectories.unshift(directory);
            } else {
                try {
                    await this.rmdir(directory);
                    tl.debug(`rmdir ${directory}`);
                } catch (reason) {
                    tl.debug(`${reason}: ${directory}`)
                }
            }

            for (let fileEntry of fileEntries) {
                let filePath = pt.posix.join(directory, fileEntry.filename);
                let isDir: boolean = await this.isDirectory(filePath);
                if (isDir) {
                    directories.push(filePath);
                } else {
                    try {
                        await this.unlink(filePath);
                        tl.debug(`unlink ${filePath}`);
                    } catch (reason) {
                        tl.debug(`${reason}: ${filePath}`)
                    }

                }
            }
        }

        for (let dir of nonEmptyDirectories) {
            try {
                await this.rmdir(dir);
                tl.debug(`rmdir ${dir}`);
            } catch (reason) {

                if(reason && reason.code == sftpStatusCode.FAILURE ){
                    reason.message = "Directory not empty"
                }
                tl.debug(`${reason}: ${dir}`)
            }
        }
    }

    async cleanDirectory(directory: string) {

        let isDir = await this.isDirectory(directory);
        if (!isDir) {
            throw new Error(`The path [${directory}] is not a directory`);
        }

        let fileEntries = [];

        try {
            fileEntries = await this.readir(directory);
            tl.debug(`readir ${directory}`);
        } catch (reason) {
            tl.debug(`${reason}: ${directory}`);
        }

        for (let fileEntry of fileEntries) {
            let filePath = pt.posix.join(directory, fileEntry.filename);
            let isDir: boolean = await this.isDirectory(filePath);
            if (isDir) {
                try {
                    await this.removeDirectory(filePath);
                } catch (reason) {
                     tl.debug(`${reason}: ${filePath}`)
                }
            } else {
                try {
                    await this.unlink(filePath);
                    tl.debug(`unlink ${filePath}`);
                } catch (reason) {
                    console.log(`${reason}: ${filePath}`)
                }
            }
        }
    }


}
