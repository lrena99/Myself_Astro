// 归档列表筛选：按 URL 参数 (?tag= / ?category= / ?uncategorized) 过滤文章
// 兼容 Swup 无刷新导航：astro:page-load 每次页面切换后触发
(function () {
	function applyFilter() {
		var params = new URLSearchParams(window.location.search);
		var tags = params.getAll("tag");
		var categories = params.getAll("category");
		var uncategorized = params.get("uncategorized");
		if (!tags.length && !categories.length && !uncategorized) {
			return;
		}

		var items = document.querySelectorAll(".card-base [data-category]");
		items.forEach(function (a) {
			var cat = a.getAttribute("data-category") || "";
			var tgs = (a.getAttribute("data-tags") || "")
				.split(",")
				.filter(Boolean);
			var match = true;
			if (categories.length) {
				match = match && categories.indexOf(cat) !== -1;
			}
			if (tags.length) {
				match =
					match &&
					tgs.some(function (t) {
						return tags.indexOf(t) !== -1;
					});
			}
			if (uncategorized) {
				match = match && !cat;
			}
			if (!match) {
				a.style.display = "none";
			}
		});

		// 隐藏没有可见文章的年份分组
		document
			.querySelectorAll(".card-base [data-group-year]")
			.forEach(function (group) {
				var visible = Array.prototype.filter.call(
					group.querySelectorAll("a[data-category]"),
					function (a) {
						return a.style.display !== "none";
					},
				).length;
				if (visible === 0) {
					group.style.display = "none";
				}
			});
	}

	// 初次加载 + Swup/astro 页面切换都执行
	if (document.readyState === "loading") {
		document.addEventListener("DOMContentLoaded", applyFilter);
	} else {
		applyFilter();
	}
	document.addEventListener("astro:page-load", applyFilter);
	document.addEventListener("swup:contentReplaced", applyFilter);
})();
