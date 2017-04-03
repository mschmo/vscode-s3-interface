'use strict';

import { TextDocumentContentProvider, ExtensionContext, TreeExplorerNodeProvider, commands, window, workspace, Uri} from 'vscode';

import { BucketContents, BucketNode } from './bucket-contents';
import { S3API } from './s3-api';


export function activate(context: ExtensionContext) {
    var config = workspace.getConfiguration('s3Interface');
    if (config.accessKeyId === null || config.secretAccessKey === null || config.bucketName === null) {
        window.showErrorMessage('Must provide access key, secret, and bucket name in settings.');
        return;
    }

    var s3 = new S3API(config.accessKeyId, config.secretAccessKey, config.bucketName, config.region);
    window.registerTreeExplorerNodeProvider('s3NodeProvider', new S3NodeProvider(s3));

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

    private bucketContents: BucketContents;

    constructor(public s3: S3API) { }

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
        var root = new BucketNode(this.s3.bucketName, '', true);
        root.children = this.s3.contents.structuredContents;
        return root;
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