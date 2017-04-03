/* Classes to organize S3 file structures */

'use strict';


export class BucketContents {

    private delimiter: string = '/';

    public structuredContents: BucketNode[];

    constructor(public contents: any[]) {
        this.setContents();
     }

    private setContents() {
        // Warning: Not very performant
        var dirs_added: string[] = [];
        this.structuredContents = [];
        this.contents.forEach((val, idx) => {
            val = val.Key;
            if (val.indexOf(this.delimiter) == -1) {
                this.structuredContents.push(new BucketNode(val, val));
                return;
            }
    
            // Directories
            // This only goes 1 layer deep currently
            var path = val.split(this.delimiter);
            var base_name = path[0];
            var node = new BucketNode(base_name, val, true);
            if (dirs_added.indexOf(base_name) === -1) {
                this.structuredContents.push(node);
                dirs_added.push(base_name);
            } else {
                this.structuredContents.forEach((nval, idx) => {
                    if (nval.name === base_name) {
                        nval.addChild(new BucketNode(path[1], val));
                    }
                })
            }
        });
    }

}

export class BucketNode {

    public children: BucketNode[];

    constructor(public name: string, public key : string, public is_dir: Boolean = false) {
        if (is_dir) {
            this.children = [];
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
