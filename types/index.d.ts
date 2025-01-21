export interface Options {
    map: Record<string, string>;
}
export declare function reloadCdnPlugin(options: Options): {
    name: string;
    apply: string;
    transformIndexHtml(): {
        tag: string;
        children: string;
    }[];
    transform(code: string, id: string): string | undefined;
};
