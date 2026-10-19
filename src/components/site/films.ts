export type Film = {
  id: string;
  title: string;
  kind: string;
  length: string;
  audio: boolean;
  src: string;
  poster: string;
  detail: string;
};

export const films: Film[] = [
  {
    id: "find",
    title: "Find 21",
    kind: "Code Lab",
    length: "22s",
    audio: true,
    src: "/films/code-lab.mp4",
    poster: "/films/find-poster.jpg",
    detail: "The problem is a sorted list. The goal is to find 21 without reading every box. The middle is too low, then too high, then 21.",
  },
  {
    id: "top",
    title: "Why it stays up",
    kind: "Explainer",
    length: "16s",
    audio: true,
    src: "/films/moon.mp4",
    poster: "/films/top-poster.jpg",
    detail: "A top should fall. A spin pulls it upright. Stop the spin, and it falls. That is the whole idea.",
  },
  {
    id: "story",
    title: "Ek lattu",
    kind: "Story",
    length: "11s",
    audio: true,
    src: "/films/story.mp4",
    poster: "/films/story-poster.jpg",
    detail: "It should fall. A string and a spin, and it walks. The moon does the same trick, and it never lands.",
  },
  {
    id: "launch",
    title: "Any idea",
    kind: "Launch",
    length: "17s",
    audio: true,
    src: "/films/launch.mp4",
    poster: "/films/launch-poster.jpg",
    detail: "An idea is stuck. Three ways out: explainer, code lab, story. The model plans. You approve. Code renders.",
  },
  {
    id: "house",
    title: "One house",
    kind: "Product film",
    length: "16s",
    audio: true,
    src: "/films/wedding.mp4",
    poster: "/films/house-poster.jpg",
    detail: "The wedding is in ten chats. Mehendi, baraat, and the wedding day go on one board. A guest opens one link.",
  },
];
