#!/usr/bin/perl -w

# prepare.pl
# Prepare the system use dirlist+.

use strict;
use warnings;

use CPAN;

my $name = 'dirlist+';
my $version = '0.1';
my $author = 'Nathan Campos <nathanpc@dreamintech.net>';

# About the project.
sub about {
	print "$name $version\n";
	print "$author\n\n";
}

# Install the pre-requisites.
sub install_prereqs {
	my (@prereq) = @_;

	foreach my $module (@prereq) {
		print "\nInstalling $module\n";
		CPAN::Shell->force("install", $module);
	}
}

# Show some info about this thing.
about();

# Install requirements.
my @modules = ("File::Path::Expand",
			   "File::MimeInfo",
			   "File::Slurp",
			   "URI::Escape",
			   "PHP::Strings",
			   "String::Util",
			   "Image::EXIF",
			   "MP3::Tag",
			   "YAML::Tiny",
			   "Mojolicious::Lite",
			   "Image::Magick");
print "Installing the required Perl modules\n";
install_prereqs(@modules);

# TODO: Check if the executables (ffmpeg and mplayer) exist.
