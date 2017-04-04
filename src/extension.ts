'use strict';

import { TextDocumentContentProvider, ExtensionContext, TreeExplorerNodeProvider, commands, window, workspace, Uri} from 'vscode';

import { BucketContents, BucketNode } from './bucket-contents';
import { S3API } from './s3-api';


export function activate(context: ExtensionContext) {
    var config = workspace.getConfiguration('s3Interface');
    // any(config[k] is None for k in ('accessKeyId', 'secretAcessKey', 'bucketName'))
    if (config.accessKeyId === null || config.secretAccessKey === null || config.bucketName === null) {
        // TODO: Specify which value(s) is missing
        window.showErrorMessage('Must provide access key, secret, and bucket name in settings.');
        return;
    }

    // Get all the objects and register provider with BucketContents structure.
    // I think the data structure of BucketContents shouls be something like a B-Tree.
    // But I don't know what a B-Tree is.
    // I'll Google it later.
    var s3 = new S3API(config.accessKeyId, config.secretAccessKey, config.bucketName, config.region);
    s3.setContents().then(contents => {
        window.registerTreeExplorerNodeProvider('s3NodeProvider', new S3NodeProvider(contents));
    });

    const commandRegistration = commands.registerCommand('s3Interface.clickedFile', node => {
        if (node.is_dir) {
            return;
        }

        // Should check first if file exists, to not repeat the request
        s3.getFileContents(node.key).then(body => { 
            var provider = new S3ContentProvider(body);
            workspace.registerTextDocumentContentProvider(S3ContentProvider.scheme, provider);
            var uri = Uri.parse(`${ S3ContentProvider.scheme }:${ node.name }?key=${ node.key }`);
            var document = workspace.openTextDocument(uri);
            return document.then(doc => {
                window.showTextDocument(doc)
            });
        });
    });
    context.subscriptions.push(
		commandRegistration
	);
}

class S3NodeProvider implements TreeExplorerNodeProvider<BucketNode> {

    // private bucketContents: BucketContents;

    constructor(public bucketContents: BucketContents) { }

    getLabel(node: BucketNode) {
        return node.name;
    }

    getHasChildren(node: BucketNode) {
        return node.hasChildren();
    }

    getClickCommand(node: BucketNode) {
        return 's3Interface.clickedFile';
    }

    provideRootNode(): BucketNode {
        return this.bucketContents.root;
    }

    resolveChildren(node: BucketNode): Thenable<BucketNode[]> {
        return new Promise((res, rej) => {
            res(node.children);
        });
    }
}

class S3ContentProvider implements TextDocumentContentProvider {
    // TODO: This pretty sure this is read only... crap.

    static scheme = 's3-provider';

    constructor(public body) { }

    provideTextDocumentContent(uri, token) {
        return this.body;
    }

}
