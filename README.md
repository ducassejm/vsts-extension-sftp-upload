# Introduction
Copy files from source folder to target folder on a remote machine using SFTP.  


# Features
* Compatible with Team Foundation Server 2015 Update 3 and above and Visual Studio Team Service.
* Copy files matching a set of minimatch patterns from a source folder to a target folder on the remote machine.
* Cross platform. The SFTP Upload task can run on Windows or Unix based Agents.
* Clean directory function supports Chroot directories.
* Supports password and private key authentication.


# Arguments
Argument|descrition
--------|----------
Source folder       | The source folder of the files to copy to the remote machine.  When empty, the root of the repository (build) or artifacts directory (release) is used, which is $(System.DefaultWorkingDirectory).  Use [variables](https://docs.microsoft.com/en-us/vsts/build-release/concepts/definitions/build/variables?tabs=batch) if files are not in the repository. Example: $(Agent.BuildDirectory)
Contents    | File paths to include as part of the copy. Supports multiple lines of [minimatch patterns](https://docs.microsoft.com/en-us/vsts/build-release/tasks/file-matching-patterns). Default is `**` which includes all files (including sub folders) under the source folder.<ul><li>Example: `**/*.jar \n **/.war` includes all jar and war files (including sub folders) under the source folder.</li><li>Example: `** \n !**/*.xml` includes all files (including sub folders) under the source folder but excludes xml files.</li></ul>
Target folder   | Target folder on the remote machine to where files will be copied. Example: /home/user/MySite, C:\\inetpub\\wwwroot\\MySite. Preface with a tilde (~) to specify the user's home directory.
Host name   | Host name or IP address of the remote machine.
Port number | Port number on the remote machine to use for connecting.
User name   | The user name.
Password    |  The password.  An enviroment can be used in order to secure the password. Example: `$(mypassword)`
Private key | The private key in OpenSSH format. 
Clean target folder | Delete all existing files and subfolders in the target folder before copying.
Fail on clean errors    | Fail if there is an error while cleaning the target folder. Only applies when Clean target folder is true.
Overwrite   | Replace existing files in and beneath the target folder.
Fail if no files found to copy | Fail if no matching files to be copied are found under the source folder.
Flatten folders | Flatten the folder structure and copy all files into the specified target folder on the remote machine.

# Getting started
Add the SFTP task by using "Add Task--> Utility" from the Build or Release section. 

![Add SFTP task](/images/sftpupload-add-task.png)

# How to use
Simply fill-in the required fields.  Refer the the Argument section for the meaning of the fields.

![SFTP Form](/images/sftpupload-entry-form.png)







