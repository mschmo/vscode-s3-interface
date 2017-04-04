/* Classes to organize S3 file structures */

'use strict';


export class BucketContents {

    static delimiter: string = '/';

    public structuredContents: BucketNode[];

    public root: BucketNode;

    constructor(public contents: any[]) {
        this.setContents();
        this.root = new BucketNode('', true);
        this.root.children = this.structuredContents;
     }

    private setContents() {
        // TODO: Get someone who knows a lot about data structures
        // and algorithms to make all this crap better.
        this.structuredContents = [];
        this.contents.forEach((val, idx) => {
            var key: string = val.Key;
            if (key.indexOf(BucketContents.delimiter) == -1) {
                this.structuredContents.push(new BucketNode(key));
                return;
            }
    
            // Directories
            // This only goes 1 layer deep currently
            var pathSegments: string[] = key.split(BucketContents.delimiter);
            var fileName: string = pathSegments[pathSegments.length - 1];
            
            if (fileName === '') {
                var node = new BucketNode(key, true);
                this.structuredContents.push(node);
                return;
            }
            

            var workingDirectory: string = pathSegments.slice(0, pathSegments.length - 1).join(BucketContents.delimiter);
            workingDirectory += BucketContents.delimiter
            for (node of this.structuredContents) {
                if (node.name === workingDirectory) {
                    node.addChild(new BucketNode(key));
                }
            }
        });
    }
    
    getParentDir(key: string): BucketNode|number {
        for (var node of this.structuredContents) {
            if (node.key === key && node.is_dir) {
                return node;
            }
        }
        return -1;
    }

}

export class BucketNode {

    public children: BucketNode[];

    public name: string;

    constructor(public key : string, public is_dir: Boolean = false) {
        if (is_dir) {
            this.children = [];
            this.name = key
        } else {
            var split_key = key.split(BucketContents.delimiter);
            this.name = split_key[split_key.length - 1];
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
