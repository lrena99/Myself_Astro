import type { Song } from "./types";

export const STORAGE_KEY_VOLUME = "music-player-volume";

export const DEFAULT_VOLUME = 0.7;

export const LOCAL_PLAYLIST: Song[] = [
	{
		id: 1,
		title: "きっと青春が聞こえる",
		artist: "μ's",
		cover: "assets/music/cover/lovelive.webp",
		url: "assets/music/url/lovelive-01.mp3",
		duration: 247,
	},
	{
		id: 2,
		title: "ススメ→トゥモロウ",
		artist: "高坂穂乃果・南ことり・園田海未",
		cover: "assets/music/cover/lovelive.webp",
		url: "assets/music/url/lovelive-02.mp3",
		duration: 274,
	},
	{
		id: 3,
		title: "僕らは今のなかで",
		artist: "μ's",
		cover: "assets/music/cover/lovelive.webp",
		url: "assets/music/url/lovelive-03.mp3",
		duration: 276,
	},
	{
		id: 4,
		title: "START: DASH!!",
		artist: "高坂穂乃果・南ことり・園田海未",
		cover: "assets/music/cover/lovelive.webp",
		url: "assets/music/url/lovelive-04.mp3",
		duration: 254,
	},
	{
		id: 5,
		title: "WILD STARS",
		artist: "μ's",
		cover: "assets/music/cover/lovelive.webp",
		url: "assets/music/url/lovelive-05.mp3",
		duration: 258,
	},
	{
		id: 6,
		title: "輝夜の城で踊りたい",
		artist: "μ's",
		cover: "assets/music/cover/lovelive.webp",
		url: "assets/music/url/lovelive-06.mp3",
		duration: 271,
	},
];

export const DEFAULT_SONG: Song = {
	title: "Sample Song",
	artist: "Sample Artist",
	cover: "/favicon/favicon.ico",
	url: "",
	duration: 0,
	id: 0,
};

export const DEFAULT_METING_API =
	"https://www.bilibili.uno/api?server=:server&type=:type&id=:id&auth=:auth&r=:r";
export const DEFAULT_METING_ID = "14164869977";
export const DEFAULT_METING_SERVER = "netease";
export const DEFAULT_METING_TYPE = "playlist";

export const ERROR_DISPLAY_DURATION = 3000;
export const SKIP_ERROR_DELAY = 1000;
