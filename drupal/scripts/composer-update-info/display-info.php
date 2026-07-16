<?php

require __DIR__ . '/../../vendor/autoload.php';

use Symfony\Component\Console\Application;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Helper\Table;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

// Create a new Symfony Console Application.
$application = new Application();

// Define the command in a closure.
$command = new Command('app:display-update-info');
$command->setDescription('A console command to display various update info.');

$command->setCode(function (InputInterface $input, OutputInterface $output) {
  // Create a SymfonyStyle instance.
  $io = new SymfonyStyle($input, $output);

  // Get file content from composer_update_dry_run_output.txt.
  $composer_update_output = file_get_contents('/tmp/composer_update_dry_run_output.txt');

  // Split by lines.
  $composer_update_content_lines = explode("\n", $composer_update_output);

  // Load composer.json.
  $composer_file_content = file_get_contents('composer.json');
  $composer_json = json_decode($composer_file_content, TRUE);

  // Get package names.
  $all_packages = array_merge(
    array_keys($composer_json['require']),
    array_keys($composer_json['require-dev']),
  );

  $patched_packages = $composer_json['extra']['patches'];

  // Build data for update info table.
  $upgradable_packages_table_data = [];
  foreach ($all_packages as $package) {
    foreach ($composer_update_content_lines as $line) {
      if (str_contains($line, "- Upgrading $package (") && !isset($upgradable_packages_table_data[$package])) {
        $version_update = trim($line);
        $version_update = str_replace("- Upgrading $package (", '', $version_update);
        $version_update = str_replace(")", '', $version_update);

        $upgradable_packages_table_data[$package] = [
          'package' => $package,
          'version_update' => $version_update,
          'has_patches' => array_key_exists($package, $patched_packages) ? 'yes' : 'no',
        ];
      }
    }
  }

  // Build data for table with patched packages.
  $patched_packages_table_data = [];
  foreach (array_keys($patched_packages) as $package) {
    foreach ($composer_update_content_lines as $line) {
      if (str_contains($line, "- Upgrading $package (")) {
        $version_update = trim($line);
        $version_update = str_replace("- Upgrading $package (", '', $version_update);
        $version_update = str_replace(")", '', $version_update);

        $patched_packages_table_data[$package] = [
          'package' => $package,
          'version_update' => $version_update,
        ];
      }
    }
  }

  ksort($upgradable_packages_table_data);

  // Display output from composer update.
  $io->section("Output form 'composer update --dry-run'");
  $io->write($composer_update_output);

  // Display direct dependencies.
  $io->section('Upgradable packages in composer.json (direct dependencies)');
  $io->block('This table lists all upgradable packages which are directly in the composer.json, along with the patch info.');
  $table = new Table($output);
  $table
    ->setHeaders(['Package', 'Version Change', 'Has Patch'])
    ->setRows($upgradable_packages_table_data);
  $table->render();

  $output->writeln('');

  // Display updatable packages with patches.
  $io->section('Upgradable packages with patches');
  $io->block("This table lists all upgradable packages with patches, which are indirectly required. \nFor example when a package like drupal/core-recommended has drupal/core as a dependency.");
  $table = new Table($output);
  $table
    ->setHeaders(['Package', 'Version Change'])
    ->setRows($patched_packages_table_data);
  $table->render();

  return Command::SUCCESS;
});

// Add the command to the application.
$application->add($command);

// Run the application.
$application->run();
