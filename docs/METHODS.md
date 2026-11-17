# Data and analysis conditions

## Scope

MeowAtlas is a fixed listening atlas of the existing 440 CatMeows v1.0.2 recordings
from 21 cats: 10 Maine Coons and 11 European Shorthairs. It does not accept new
audio or predict emotions, intentions, breeds, or recording contexts.

## Recording source

The CatMeows authors describe a QCY Q26 Pro Bluetooth headset microphone mounted
on a collar, below the cat's throat and facing upward. Audio was transmitted to
a smartphone running Easy Voice Recorder PRO at an 8 kHz sampling rate. The
sampling rate limits the represented frequency range to at most 4 kHz.

The three contexts were brushing at home, waiting for food in a familiar
environment, and isolation in an unfamiliar environment. In the isolation
protocol, cats first spent 30 minutes with their owners in the unfamiliar
environment and were then left alone for at most five minutes. Brushing lasted
at most five minutes, and food was provided within five minutes of the feeding
routine starting. The source describes veterinary supervision.

The distributed files contain one vocalization each, with approximately
0.5-second handles before and after it. The handles include background sound.
The source paper describes the Maine Coon group as sharing an owner and housing
conditions, and the European Shorthair group as coming from different owners and
housing conditions. The map does not disentangle these factors from breed.

Source: Ludovico et al. (2021), sections 2–3.
[University-hosted paper](https://air.unimi.it/retrieve/handle/2434/811133/1692648/Ludovico2021_Chapter_CatMeowsAPublicly-AvailableDat.pdf).

## Adopted preprocessing

Each original WAV is read as mono float64 at 8 kHz. The first and last 0.4 seconds
are removed, followed by a 0.05-second linear fade at each end. These values
follow the preprocessing example in section 4.2 of the CatMeows paper, whose
stated purpose is to reduce background events in the handles. No additional
onset detection, time stretching, denoising, high-pass filtering, or peak-volume
normalization is applied.

Features are computed from the processed floating-point signal. Playback WAVs
are encoded afterward as 16-bit PCM. The same playback files are used in both
pages. A playback file's duration includes any remaining margins and is not a
separately measured vocalization duration.

## Features and embedding

| Stage | Adopted settings |
| --- | --- |
| Mel spectrogram | 40 bands, 0–4 kHz, power spectrum, Slaney normalization |
| Window | Hann, 240 samples / 30 ms; FFT size 240 |
| Hop | 30 samples / 3.75 ms |
| Centering | Centered frames, reflect padding |
| Log scale | Per-recording maximum = 0 dB; floor −80 dB; `amin=1e-10` |
| Standardization | One population z-score across the entire unpadded spectrogram of each recording |
| Padding | Append zeros to reach 854 time frames; zero denotes the standardized mean, not acoustic silence |
| Vector | C-order flattening; 40 × 854 = 34,160 float32 values |
| UMAP | 2 dimensions, 15 neighbors, `min_dist=0.1`, Euclidean distance |
| Optimization | Seed 42, spectral initialization, 500 epochs, one job |
| Coordinate postprocessing | None |

Complete settings are in [analysis/recipe.json](../analysis/recipe.json).
This Mel-plus-UMAP pipeline is MeowAtlas's adopted method; the shared
preprocessing does not make it a reproduction of the CatMeows paper's entire
feature analysis.

The adopted recipe follows earlier literature-informed comparisons and
label-free neighborhood-preservation and stability checks. Recording-context
labels were not used as embedding inputs or as the final recipe-selection score.
These checks do not establish that the feature distance matches human hearing.

## The fixed map and comparison candidates

`site/data.js` stores the final coordinates, recording metadata, and all
comparison rankings. Experience and Analysis display identical coordinates.
Filtering hides points while retaining the global map; it does not refit UMAP.
UMAP 1 and UMAP 2 have no physical units.

Analysis displays up to three alternative recordings for A. Candidates are
drawn from the currently visible recordings, excluding A. Near and far refer to
ascending or descending Euclidean distance, either in the original feature
vectors or in the fixed two-dimensional coordinates. These two rankings can
differ because dimensionality reduction changes distance relationships.

Both displayed spectrograms use 0–3.5 seconds and 0–4 kHz with a shared relative
−80 to 0 dB scale. Each recording has its own maximum reference, so spectrogram
colors cannot compare absolute loudness between recordings. Display images use
8-bit quantization; the analysis vectors are not computed from those images.

## Interpretation limits

The feature vectors retain timing. Differences in processed recording length,
onset timing, temporal patterns, and background sound affect their distance.
Standardizing each spectrogram does not remove the length dependence of the
vector norm. UMAP also does not preserve every distance or density relationship.

Consequently, neighboring points need not sound similar, and islands or gaps do
not establish distinct natural classes. Recording-context colors are source
metadata, not labels for emotions or intentions. Recordings from the same cat or
session are repeated observations, not independent samples of a breed.

Cat photographs are breed-reference images of different animals. Cat profiles
come from dataset filename codes; colors and markings in the photographs are
not information about the recorded cats.

## Implementation

The runtime consists of HTML, CSS, JavaScript, Plotly.js, HTML audio, and canvas
spectrograms. Audio and analysis data are prepared offline in Python. Hosting
serves these stored files and requires no inference backend. Analysis selection
and filter preferences are saved in browser local storage.
