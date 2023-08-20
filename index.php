<?php
namespace App;

require_once "./vendor/autoloader.php";

use DafCore\Application;
use App\Controllers\HomeController;
use App\Controllers\Api\AccountsApiController;
use DafDb\Mysql\Context;
use App\Repositories\UsersRepository;
//{using}

date_default_timezone_set("Asia/Jerusalem");
$app = new Application();

$app->services->addSingleton(Context::class, fn() => new Context("doron_melaket","doron_melaket","melaket123"));
$app->services->addSingleton(UsersRepository::class, fn($x) => new UsersRepository($x->getService(Context::class)));

$app->router->addController(HomeController::class);
$app->router->addController(AccountsApiController::class);
//{controllers}

try {
    $app->run();
} catch (\Throwable $th) {
    echo $th->getMessage();
}
?>