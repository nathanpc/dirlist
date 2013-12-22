#!/usr/bin/perl -w

# prepare.pl
# Prepare the system use dirlist+.

use strict;
use warnings;

use CPAN;
use Term::ANSIColor;

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

	print colored("Installing the required Perl modules\n", "green");
	foreach my $module (@prereq) {
		print colored("\nInstalling $module\n", "blue");
		CPAN::Shell->force("install", $module);
	}
}

# Check if a program is installed.
sub program_installed {
	my (@programs) = @_;

	foreach my $program (@programs) {
		if (`which $program` eq '') {
			print colored("'$program' wasn't detected in your system, please install it to be able to run dirlist+.\n", "red");
		}
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
install_prereqs(@modules);

# Check if the required programs are installed.
my @programs = ("ffmpeg", "mplayer");
program_installed(@programs);

# Just a little tip for the user.
print colored("If you want to have the logs stored you should to create a directory called 'log'\n", "blue");
