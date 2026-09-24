import { Html5Audio, Sequence, useVideoConfig } from "remotion";
import { musicVolumeAt } from "../lib/audio";
import { mediaUrl } from "../media";
import type { MusicProps, VoiceOverProps } from "../schemas";

/**
 * Bande son commune à tous les templates : musique de fond (fondus, boucle,
 * baisse automatique pendant la voix) et voix off. Les fichiers sont servis
 * par le studio local ; sans studio (aperçu hors connexion), rien n'est joué.
 */
export function ReelAudio({
  music,
  voiceOver,
  mediaBaseUrl,
}: {
  music: MusicProps | null;
  voiceOver: VoiceOverProps | null;
  mediaBaseUrl?: string;
}) {
  const { fps, durationInFrames } = useVideoConfig();
  const musicSrc = music ? mediaUrl(music.path, mediaBaseUrl) : null;
  const voiceSrc = voiceOver ? mediaUrl(voiceOver.path, mediaBaseUrl) : null;

  return (
    <>
      {music && musicSrc ? (
        <Html5Audio
          src={musicSrc}
          loop
          // La courbe de volume continue d'une boucle à l'autre (fondu de sortie sur la fin du Reel).
          loopVolumeCurveBehavior="extend"
          volume={(frame) => musicVolumeAt(frame, { music, totalFrames: durationInFrames, fps, voice: voiceOver })}
        />
      ) : null}
      {voiceOver && voiceSrc ? (
        <Sequence from={Math.round(voiceOver.startSeconds * fps)} layout="none">
          <Html5Audio src={voiceSrc} volume={voiceOver.volume} />
        </Sequence>
      ) : null}
    </>
  );
}
