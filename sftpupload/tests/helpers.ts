import ma = require('vsts-task-lib/mock-answer');

export class Helpers {

    static getAnswersSourcePathIsDectory(): ma.TaskLibAnswers {
        return <ma.TaskLibAnswers>
            {
                "checkPath": {
                    "/user/build": true,
                    "/user/build/file1.txt":true
                },
                "stats": {
                    "/user/build": {
                        "isDirectory": true
                    }
                },
                "find": {
                    "/user/build": [
                        "/user/build/file1.txt",
                        "/user/build/file2.txt",
                        "/user/build/folder/file3.txt"
                    ]
                },
                "match": {
                    "/user/build/**": [
                        "/user/build/file1.txt",
                        "/user/build/file2.txt",
                        "/user/build/folder/file3.txt"
                    ]
                },
               "findMatch": {
                    "**/*": [
                        "/user/build/file1.txt",
                        "/user/build/file2.txt",
                        "/user/build/folder/file3.txt"
                    ]
                }                
            }
    }

    static getAnswersSourcePathIsFile(): ma.TaskLibAnswers {
        return <ma.TaskLibAnswers>
            {
                "checkPath": {
                    "/user/build": true
                },
                "stats": {
                    "/user/build": {
                        "isDirectory": false
                    }
                },
                "find": {
                    "/user/build": []
                },
                "match": {
                }
            }
    }
}
