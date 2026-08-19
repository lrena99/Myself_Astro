// 归档列表筛选：按 URL 参数 (?tag= / ?category= / ?uncategorized) 过滤文章
// 由 Layout.astro 全局引入：监听器常驻，Swup 无刷新切换后依然生效
(function () {
	if (window.__archiveFilterInit) return;
	window.__archiveFilterInit = true;

	function applyFilter() {
		var listEl = document.querySelector("[data-archive-list]");
		if (!listEl) return; // 当前页面没有归档列表

		var params = new URLSearchParams(window.location.search);
		var tags = params.getAll("tag");
		var categories = params.getAll("category");
		var uncategorized = params.get("uncategorized") !== null;

		var items = listEl.querySelectorAll("a[data-category]");
		var groups = listEl.querySelectorAll("[data-group-year]");

		// 无筛选参数：恢复全量显示（覆盖 Swup 切换后的残留隐藏状态）
		if (!tags.length && !categories.length && !uncategorized) {
			items.forEach(function (a) {
				a.style.display = "";
			});
			groups.forEach(function (group) {
				var count = group.querySelector(".group-count");
				if (count) {
					count.textContent = String(
						group.querySelectorAll("a[data-category]").length,
					);
				}
				group.style.display = "";
			});
			return;
		}

		groups.forEach(function (group) {
			var visible = 0;
			group.querySelectorAll("a[data-category]").forEach(function (a) {
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
				a.style.display = match ? "" : "none";
				if (match) visible++;
			});

			// 更新年份分组的文章计数
			var count = group.querySelector(".group-count");
			if (count) {
				count.textContent = String(visible);
			}
			// 隐藏没有可见文章的年份分组
			if (visible === 0) {
				group.style.display = "none";
			} else {
				group.style.display = "";
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
