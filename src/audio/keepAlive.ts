export function createKeepAlive() {
  const buffer = new ArrayBuffer(8044);
  const view = new DataView(buffer);

  const ascii = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  ascii(0, "RIFF");
  view.setUint32(4, 8036, true);
  ascii(8, "WAVEfmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  ascii(36, "data");
  view.setUint32(40, 8000, true);

  for (let index = 0; index < 8000; index += 1) {
    view.setUint8(44 + index, 128);
  }

  const url = URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
  const audio = new Audio(url);

  audio.loop = true;
  audio.setAttribute("playsinline", "true");

  return audio;
}

export function destroyKeepAlive(audio: HTMLAudioElement) {
  const { src } = audio;

  audio.pause();
  audio.removeAttribute("src");
  audio.load();

  if (src.startsWith("blob:")) {
    URL.revokeObjectURL(src);
  }
}
