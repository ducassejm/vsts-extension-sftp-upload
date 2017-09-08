import os = require('os');
import path = require('path');
import Q = require('q');
import tl = require('vsts-task-lib/task');
import ssh2 = require("ssh2");
import sftp = require('./sftp-helper')



function writeLine(message: string) {
    console.log(message);
}

function getDefaultFindOptions(): tl.FindOptions {
    return <tl.FindOptions>{
        followSpecifiedSymbolicLink: true,
        followSymbolicLinks: true
    }
}

function getDefaultMatchOptions(): tl.MatchOptions {

    return <tl.MatchOptions>{
        debug: false,
        nobrace: true,     // brace expansion off - brace expansion cannot be escaped on Windows
        noglobstar: false, // globstar on
        dot: true,         // make * match files that start with . without requiring an additional
        // pattern .* to match files that start with .
        noext: false,      // extended globbing on
        nocase: process.platform == "win32", // case insensitive on Windows, otherwise case sensitive
        nonull: false,
        matchBase: false,
        nocomment: false,  // support comments
        nonegate: false,   // support negate pattern
        flipNegate: false
    }
}

function getFilesToCopy(defaultRoot: string, patterns: string[] | string): string[] {
    let findOptions: tl.FindOptions = getDefaultFindOptions();
    let matchOptions: tl.MatchOptions = getDefaultMatchOptions();
    let filesAndDirectoryMatches = tl.findMatch(defaultRoot, patterns, findOptions, matchOptions);

    let filesToCopy: string[] = [];

    tl.debug("filering out the directories from the path list");

    for (let fileOrDirectory of filesAndDirectoryMatches) {
        if (!tl.stats(fileOrDirectory).isDirectory()) {
            filesToCopy.push(fileOrDirectory);
        }
    }

    tl.debug(`found ${filesToCopy.length} to copy.`);
    return filesToCopy;
}

async function run() {
    var sshHelper: sftp.SftpHelper;
    try {

        tl.setResourcePath(path.join(__dirname, 'task.json'));

        //read SFTP endpoint input
        var username: string = tl.getInput('username', true);
        var password: string = tl.getInput('password', false); //passphrase is optional
        var privateKey: string = tl.getInput('privatekey', false); //private key is optional, password can be used for connecting
        var hostname: string = tl.getInput('host', true);
        var port: string = tl.getInput('port', false); //port is optional, will use 22 as default port if not specified

        if (!port || port === '') {
            writeLine(tl.loc('UseDefaultPort'));
            port = '22';
        }

        //setup the SFTP connection configuration based on endpoint details
        let sshConfig: ssh2.ConnectConfig;
        if (privateKey && privateKey !== '') {
            tl.debug('Using private key for ssh connection.');
            sshConfig = {
                host: hostname,
                port: Number(port),
                username: username,
                privateKey: privateKey,
                passphrase: password
            }
        } else {
            //use password
            tl.debug('Using username and password for ssh connection.');
            sshConfig = {
                host: hostname,
                port: Number(port),
                username: username,
                password: password
            }
        }


        // // contents is a multiline input containing glob patterns
        // var contents: string[] = tl.getDelimitedInput('contents', '\n', true);
        // var sourceFolder: string = tl.getPathInput('sourceFolder', true, true);
        // var targetFolder: string = tl.getInput('targetFolder');

        // if (!targetFolder) {
        //     targetFolder = "./";
        // } else {
        //     // '~/' is unsupported
        //     targetFolder = targetFolder.replace(/^~\//, "./");
        // }


        // // read the copy options
        // var cleanTargetFolder: boolean = tl.getBoolInput('cleanTargetFolder', false);
        // var overwrite: boolean = tl.getBoolInput('overwrite', false);
        // var failOnEmptySource: boolean = tl.getBoolInput('failOnEmptySource', false);
        // var flattenFolders: boolean = tl.getBoolInput('flattenFolders', false);


        // contents is a multiline input containing glob patterns
        var contents: string[] = tl.getDelimitedInput('contents', '\n', true);
        var sourceFolder: string = tl.getPathInput('sourceFolder', true, true);
        var targetFolder: string = tl.getInput('targetFolder');

        if (!targetFolder) {
            targetFolder = "./";
        } else {
            // '~/' is unsupported
            targetFolder = targetFolder.replace(/^~\//, "./");
        }

        // read the copy options
        var cleanTargetFolder: boolean = tl.getBoolInput('cleanTargetFolder', false);
        var overwrite: boolean = tl.getBoolInput('overwrite', false);
        var failOnEmptySource: boolean = tl.getBoolInput('failOnEmptySource', false);
        var flattenFolders: boolean = tl.getBoolInput('flattenFolders', false);
        var failOnCleanError = tl.getBoolInput('failOnCleanError', false);
        

        if (!tl.stats(sourceFolder).isDirectory()) {
            throw tl.loc('SourceNotFolder');
        }

        //initialize the SSH helpers, setup the connection
        sshHelper = new sftp.SftpHelper(sshConfig);
        await sshHelper.setupConnection();

        if (cleanTargetFolder) {
            writeLine(tl.loc('CleanTargetFolder', targetFolder));
            try {
                await sshHelper.cleanDirectory(targetFolder, failOnCleanError);
            } catch (err) {
                if (failOnCleanError) {
                    throw (err);
                }
            }
        }

        //identify the files to copy
        var filesToCopy: string[] = [];
        filesToCopy = getFilesToCopy(sourceFolder, contents);

        //copy files to remote machine
        if (filesToCopy && filesToCopy.length > 0) {
            writeLine(tl.loc('CopyingFiles', filesToCopy.length));
            tl.debug("Files to copy: " + filesToCopy);

            var fileCopyProgress: Q.Promise<string>[] = [];
            for (var i: number = 0; i < filesToCopy.length; i++) {
                var fileToCopy = filesToCopy[i];
                tl.debug('fileToCopy = ' + fileToCopy);

                var relativePath;
                if (flattenFolders) {
                    relativePath = path.basename(fileToCopy);
                } else {
                    relativePath = fileToCopy.substring(sourceFolder.length)
                        .replace(/^\\/g, "")
                        .replace(/^\//g, "");
                }
                tl.debug('relativePath = ' + relativePath);
                var targetPath = path.posix.join(targetFolder, relativePath);

                writeLine(tl.loc('StartedFileCopy', fileToCopy, targetPath));
                if (!overwrite) {
                    var fileExists: boolean = await sshHelper.checkRemotePathExists(targetPath);
                    if (fileExists) {
                        throw tl.loc('FileExists', targetPath);
                    }
                }
                //looks like scp can only hanlde one file at a time reliably
                await sshHelper.uploadFile(fileToCopy, targetPath);
            }
            writeLine(tl.loc('CopyCompleted', filesToCopy.length));
            tl.setResult(tl.TaskResult.Succeeded, tl.loc('CopyCompleted', filesToCopy.length));
        } else if (failOnEmptySource) {
            throw tl.loc('NothingToCopy');
        } else {
            tl.warning(tl.loc('NothingToCopy'));
            tl.setResult(tl.TaskResult.Succeeded, tl.loc('CopyCompleted', filesToCopy.length));
        }
    } catch (err) {
        tl.setResult(tl.TaskResult.Failed, err);
    } finally {
        //close the client connection to halt build execution
        if (sshHelper) {
            tl.debug('Closing the client connection');
            sshHelper.closeConnection();
            sshHelper = null;
        }
    }
}

run();