import { visit } from "unist-util-visit";

/**
 * 为 markdown 正文中的站内图片自动补 base 前缀（子路径部署必需）。
 * 例：![图](/images/posts/x/1.webp) → /Myself_Astro/images/posts/x/1.webp
 * 仅处理以 "/" 开头且不以 base 开头的 src，外链和已带前缀的不动。
 * 用法：rehypePlugins: [[rehypeAddBasePrefix, { base: "/Myself_Astro" }]]
 */
export function rehypeAddBasePrefix(options) {
	const base = typeof options === "string" ? options : options?.base ?? "";
	return (tree) => {
		visit(tree, "element", (node) => {
			if (node.tagName !== "img" || !node.properties?.src) return;
			const src = node.properties.src;
			if (typeof src === "string" && src.startsWith("/") && !src.startsWith(base)) {
				node.properties.src = base + src;
			}
		});
	};
}
