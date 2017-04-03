/* Class to integrate with AWS S3 API */

'use strict';

import * as vscode from 'vscode';

import AWS = require('aws-sdk');

import { BucketContents } from './bucket-contents';


export class S3API {

    private apiVersion: string = '2006-03-01';

    public s3: AWS.S3;

    public contents: BucketContents;

    constructor(accessKeyId: string, secretAccessKey: string, public bucketName: string, public region: string) {
        var credentials = new AWS.Credentials({
            accessKeyId: accessKeyId,
            secretAccessKey: secretAccessKey
        });

        this.s3 = new AWS.S3({
            credentials: credentials,
            region: region,
            apiVersion: this.apiVersion,
            params: {
                Bucket: bucketName
            }
        });

        this.s3.listObjects((err, data) => {
            if (err) {
                vscode.window.showErrorMessage(`Error accessing bucket: ${ err.message }`);
            } else {
                this.contents = new BucketContents(data.Contents);
            }
        });
    }

    getFileContents(key: string) {
        // TODO: Handle nested files. Need full path
        return new Promise((res, rej) => {
            this.s3.getObject({ Bucket: this.bucketName, Key: key }, function(err, data) {
                if (err) {
                    vscode.window.showErrorMessage(`Error getting object ${ key }: ${ err.message }`);
                    rej(err);
                } else {
                    res(data.Body.toString());
                }
            });
        });
    }
}
