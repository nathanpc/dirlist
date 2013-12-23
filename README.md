# dirlist+

A fully-featured directory listing web application.


## Installation

First of all you need to prepare your system to run dirlist+. You can do this by executing the following command, which will install the required Perl modules and check if you have the required programs installed:

    $ perl -w prepare.pl

That will probably take a while, you can use the free time to configure dirlist+. Open the `settings.yml` file and start changing the defaults to match your needs. Here's a very simple example of a config file:

```yaml
---
roots:
  Webroot:
    type: "normal"
    path:
      system: "~/Sites"
      web: "/"
```

First you have the `roots` array which defines each "Root". Roots are like shortcuts to a "virtual root path". In the repo example there are 3 Roots, one which is the Apache htdocs and other two that are subdirectories (symbolic links in that case) in the Apache htdocs. **Always remember that dirlist+ won't serve files, which means it require you to have a web server like [Apache](http://httpd.apache.org/) or [nginx](http://nginx.org/).**

Then you have the name of the root (`Webroot` in the example). Inside that you'll have the following parameters:

  - **type**: The type of root (Options: `normal`, `media`)
  - **path**: Specify the paths where dirlist+ should search/link.
    - **system**: Where the directory located in the system so dirlist+ can index it
	- **web**: Where the directory is located relative to the web server

That's all you need to have dirlist+ working. Now all you have to do is start the server:

    $ perl -w api.pl daemon

By default it'll listen on port `3000`. If you want to change port you just have to execute the following variation of the command:

    $ perl -w api.pl daemon --listen "http://*:1234"

Another thing that you'll notice is that by default dirlist+ will log to `STDOUT`. You can make it save the logs by creating a `log` folder in the same folder as the `api.pl` file.


## Dependencies

This application requires the following Perl modules:

  - [Mojolicious::Lite](http://mojolicio.us/)
  - [YAML::Tiny](http://search.cpan.org/dist/YAML-Tiny/lib/YAML/Tiny.pm)
  - [URI::Escape](http://search.cpan.org/~gaas/URI-1.60/URI/Escape.pm)
  - [File::Path::Expand](http://search.cpan.org/~rclamp/File-Path-Expand-1.02/lib/File/Path/Expand.pm)
  - [File::MimeInfo](http://search.cpan.org/~michielb/File-MimeInfo-0.21/lib/File/MimeInfo.pm)
  - [Image::Magick](http://www.imagemagick.org/script/perl-magick.php)
  - [File::Slurp](http://search.cpan.org/~uri/File-Slurp-9999.19/lib/File/Slurp.pm)
  - [Image::EXIF](http://search.cpan.org/~ccpro/Image-EXIF-0.99.4/EXIF.pm)
  - [PHP::Strings](http://search.cpan.org/~kudarasp/PHP-Strings-0.28/Strings.pm)
  - [String::Util](http://search.cpan.org/~miko/String-Util-1.21/lib/String/Util.pm)
  - [MP3::Tag](http://search.cpan.org/~ilyaz/MP3-Tag-0.92/Tag/ID3v2.pm)

Also it'll require you to have the following applications installed in your system:

  - [FFmpeg](http://www.ffmpeg.org/)
  - [Mplayer](http://www.mplayerhq.hu/design7/news.html)


## Credits

All the icons used in this project are part of the [Moka icon theme](https://github.com/snwh/moka-icon-theme/).
