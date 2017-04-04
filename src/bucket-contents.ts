/* Classes to organize S3 file structures */

'use strict';


export class BucketContents {

    static delimiter: string = '/';

    public structuredContents: BucketNode[];

    public root: BucketNode;

    constructor(public contents: any[]) {
        this.setContents();
        this.root = new BucketNode('root', true);
        this.root.children = this.structuredContents;
     }

    private setContents() {
        // TODO: Get someone who knows a lot about data structures
        // and algorithms to make all this crap better.
        this.structuredContents = [];
        for (var bucketObject of this.contents) {
            var key: string = bucketObject.Key;

            // Root level file
            if (key.indexOf(BucketContents.delimiter) == -1) {
                this.structuredContents.push(new BucketNode(key));
                continue;
            }

            // Directories
            var pathSegments: string[] = key.split(BucketContents.delimiter);
            var fileName: string = pathSegments[pathSegments.length - 1];
            var is_dir = fileName === '';

            // Special rules for root level directory
            if (pathSegments.length == 2 && is_dir) {
                this.structuredContents.push(new BucketNode(key, true));
                continue;
            }

            var pathSlice: string[] = pathSegments.slice(0, pathSegments.length - (is_dir ? 2 : 1));
            var workingDirectory: string = pathSlice.join(BucketContents.delimiter) + BucketContents.delimiter;
            // Recusively iterate over directories to find the spot to stick the object
            this.findDirectoryToAddChild(key, workingDirectory, is_dir, this.structuredContents);
        }
    }

    private findDirectoryToAddChild(key: string, workingDirectory: string, is_dir: Boolean, parentNode: BucketNode[]) {
        for (var childNode of parentNode) {
            if (!childNode.is_dir) {
                continue;
            }
            if (childNode.key === workingDirectory) {
                childNode.addChild(new BucketNode(key, is_dir));
                return;
            }
            this.findDirectoryToAddChild(key, workingDirectory, is_dir, childNode.children);
        }
    }

}

export class BucketNode {

    public children: BucketNode[];

    public name: string;

    constructor(public key : string, public is_dir: Boolean = false) {
        var splitKey: string[] = key.split(BucketContents.delimiter);
        this.name = splitKey[splitKey.length - (is_dir ? 2 : 1)];
        if (is_dir) {
            this.children = [];
            this.name += BucketContents.delimiter;
        }
    }

    addChild(node: BucketNode) {
        if (!this.is_dir) {
            return;
        }
        this.children.push(node);
    }

    hasChildren(): boolean {
        return this.is_dir && this.children.length > 0;
    }
}
