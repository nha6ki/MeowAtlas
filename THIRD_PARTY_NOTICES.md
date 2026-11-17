# Third-party notices

The MIT license for original MeowAtlas code does not replace these terms.

## CatMeows v1.0.2

**Creators:** Luca Andrea Ludovico, Stavros Ntalampiras, Giorgio Presti, Simona Cannas, Monica Battini, and Silvana Mattiello, University of Milan.

- Source: [CatMeows v1.0.2 on Zenodo](https://zenodo.org/records/4008297)
- Dataset DOI: [10.5281/zenodo.4008297](https://doi.org/10.5281/zenodo.4008297)
- License: [Creative Commons Attribution–NonCommercial 4.0 International](https://creativecommons.org/licenses/by-nc/4.0/)
- Related paper: Ludovico et al. (2021), *CatMeows: A Publicly-Available Dataset of Cat Vocalizations*, MMM 2021, LNCS 12573, pp. 230–243. [DOI](https://doi.org/10.1007/978-3-030-67835-7_20).

The version-specific Zenodo API identifies `cc-by-nc-4.0`; the record also specifies scientific research and non-commercial use. The 2021 paper names CC BY 4.0. This package uses the version-specific **CC BY-NC 4.0** terms for the dataset and its derivatives, rather than granting the broader MIT permissions of the application code. The checked source details are recorded in [docs/dataset-source.json](docs/dataset-source.json).

**Changes:** each recording is trimmed by 0.4 seconds at both ends, receives a 0.05-second linear fade at each end, and is saved as an 8 kHz mono PCM16 WAV. Log-Mel spectrograms, feature distances, and UMAP coordinates are derived from the recordings. These derived assets are kept with the dataset attribution and non-commercial terms. No affiliation with or endorsement by the dataset creators is implied.

The dataset and derived assets include `site/audio/`, `site/spectra/`, the recording-derived contents of `site/data.js` and `site/experience-data.js`, and the data in `analysis/`. Original code in `analysis/reproduce.py` is separate from those assets.

The map and spectrogram screenshots in `docs/images/` also contain derived dataset material and retain the same attribution and non-commercial terms.

## Cat photographs

Photographs illustrate the breed and distinguish cards in the interface. They do not show the recorded cats, and their coat colors or markings do not describe those cats.

The table below and [site/cat-images/credits.json](site/cat-images/credits.json) identify every image. Files are Wikimedia Commons display-size images; the interface presents them in a square frame. Original titles, authors, source pages, licenses, display changes, and hashes are preserved. Share-alike terms continue to apply to the relevant images and adaptations, independently of the application code.

| Cat ID | Photograph and source | Creator | License |
| --- | --- | --- | --- |
| ANI01 | [BlacktabbyMaine Coon.JPG](https://commons.wikimedia.org/wiki/File:BlacktabbyMaine_Coon.JPG) | Mueller-rech.muenchen | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| BAC01 | [MCO Napoleon XXXL*RU (15023848553).jpg](https://commons.wikimedia.org/wiki/File:MCO_Napoleon_XXXL*RU_(15023848553).jpg) | Nickolas Titkov from Moscow, Russian Federation | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| BLE01 | [European shorthair - URK cat show Vantaa.JPG](https://commons.wikimedia.org/wiki/File:European_shorthair_-_URK_cat_show_Vantaa.JPG) | Heikki Siltala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| BRA01 | [MCO Zinfandel White Unicoon (4382031725).jpg](https://commons.wikimedia.org/wiki/File:MCO_Zinfandel_White_Unicoon_(4382031725).jpg) | Nickolas Titkov from Moscow, Russian Federation | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| BRI01 | [Maine Coon black tortie smoke arlequin.jpg](https://commons.wikimedia.org/wiki/File:Maine_Coon_black_tortie_smoke_arlequin.jpg) | Uscoon | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| CAN01 | [European shorthair cat in SUROK cat show Helsinki 2007-07-29.JPG](https://commons.wikimedia.org/wiki/File:European_shorthair_cat_in_SUROK_cat_show_Helsinki_2007-07-29.JPG) | Heikki Siltala | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| CLE01 | [European shorthair in POROK cat show Kempele (Oulu).JPG](https://commons.wikimedia.org/wiki/File:European_shorthair_in_POROK_cat_show_Kempele_(Oulu).JPG) | Heikki Siltala | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| DAK01 | [Chatte Maine Coon Portrait.jpg](https://commons.wikimedia.org/wiki/File:Chatte_Maine_Coon_Portrait.jpg) | Azurfrog | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| IND01 | [Female european shorthair-POH-KIS cat show Seinäjoki 2010-03-06.JPG](https://commons.wikimedia.org/wiki/File:Female_european_shorthair-POH-KIS_cat_show_Sein%C3%A4joki_2010-03-06.JPG) | Heikki Siltala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| JJX01 | [Karin Maine Coon.jpg](https://commons.wikimedia.org/wiki/File:Karin_Maine_Coon.jpg) | Takashi Hososhima | [CC BY-SA 2.0](https://creativecommons.org/licenses/by-sa/2.0) |
| LEO01 | [European shorthair-PIROK cat show Tampere 2008-10-04.JPG](https://commons.wikimedia.org/wiki/File:European_shorthair-PIROK_cat_show_Tampere_2008-10-04.JPG) | Heikki Siltala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| MAG01 | [Eurooppalainen punatabby kuva tessa.jpg](https://commons.wikimedia.org/wiki/File:Eurooppalainen_punatabby_kuva_tessa.jpg) | Tessa | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| MAT01 | [European shorthair-TUROK cat show Turku 2011-11-26.JPG](https://commons.wikimedia.org/wiki/File:European_shorthair-TUROK_cat_show_Turku_2011-11-26.JPG) | Heikki Siltala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| MEG01 | [Mainecoon female.jpg](https://commons.wikimedia.org/wiki/File:Mainecoon_female.jpg) | Smoky pearl | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| MIN01 | [Elekatin Mesikämmen - EUR a - young male EX1.JPG](https://commons.wikimedia.org/wiki/File:Elekatin_Mesik%C3%A4mmen_-_EUR_a_-_young_male_EX1.JPG) | Heikki Siltala | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| NIG01 | [Maine Coon Gorgeous.jpg](https://commons.wikimedia.org/wiki/File:Maine_Coon_Gorgeous.jpg) | Atila Velo | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| NUL01 | [Maine Coon male NO Sigdalskauen Balder.jpg](https://commons.wikimedia.org/wiki/File:Maine_Coon_male_NO_Sigdalskauen_Balder.jpg) | T. Bjornstad | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0) |
| REG01 | [European shorthair TUROK cat show Turku 2010-03-27.JPG](https://commons.wikimedia.org/wiki/File:European_shorthair_TUROK_cat_show_Turku_2010-03-27.JPG) | Heikki Siltala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| SPI01 | [European shorthair portraits.JPG](https://commons.wikimedia.org/wiki/File:European_shorthair_portraits.JPG) | Heikki Siltala / Abujoy | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0) |
| TIG01 | [Red European shorthair - SUROK cat show Helsinki 2012-01-14.JPG](https://commons.wikimedia.org/wiki/File:Red_European_shorthair_-_SUROK_cat_show_Helsinki_2012-01-14.JPG) | Heikki Siltala | [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0) |
| WHO01 | [Ruthportrait (558954523).jpg](https://commons.wikimedia.org/wiki/File:Ruthportrait_(558954523).jpg) | Dan Hershman | [CC BY 2.0](https://creativecommons.org/licenses/by/2.0) |

## Plotly.js

The bundled `site/vendor/plotly.min.js` and `site/vendor/plotly-basic.min.js`
identify themselves as Plotly.js 4.1.1. Experience uses the smaller basic bundle;
Analysis retains the full bundle. The basic bundle was obtained from the
[official versioned distribution](https://cdn.plot.ly/plotly-basic-4.1.1.min.js).
The original bundle header is preserved, and the upstream [MIT license text](site/vendor/LICENSE-Plotly.txt) is included.
[Upstream source and license](https://github.com/plotly/plotly.js/tree/v4.1.1).

## Spectrogram colors

Spectrogram images use the magma colormap supplied by Matplotlib, originally by
Nathaniel J. Smith and Stefan van der Walt. The magma colormap data
are released under CC0; no Matplotlib software is shipped in the website.
[Matplotlib colormap source](https://github.com/BIDS/colormap/blob/master/colormaps.py).
