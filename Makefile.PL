# Makefile.PL for dirlist+
use ExtUtils::MakeMaker;

WriteMakefile(
	NAME      => "dirlist+",
	VERSION   => "0.1",
	AUTHOR    => "Nathan Campos <nathanpc@dreamintech.net>",
	PREREQ_PM => {
		"File::Path::Expand" => 0,
		"File::MimeInfo" => 0,
		"File::Slurp" => 0,
		"URI::Escape" => 0,
		"PHP::Strings" => 0,
		"String::Util" => 0,
		"Image::EXIF" => 0,
		"MP3::Tag" => 0,
		"YAML::Tiny" => 0,
		"Mojolicious::Lite" => 0,
		"Image::Magick" => 0
	}
);
