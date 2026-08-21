import { unified } from "unified";
import remarkParse from "remark-parse";

export type MarkdownNode = {
  type: string;
  value?: string;
  children?: MarkdownNode[];
  ordered?: boolean;
};

export const parseMarkdown = (text: string): MarkdownNode[] => {
  const processor = unified().use(remarkParse);
  const ast = processor.parse(text);

  const transform = (node: any): MarkdownNode => {
    return {
      type: node.type,
      value: node.value,
      ordered: node.ordered,
      children: node.children?.map(transform),
    };
  };

  return ast.children.map(transform);
};
