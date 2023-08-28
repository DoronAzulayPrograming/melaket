<?php
namespace App;

require_once "./vendor/autoloader.php";

use DafCore\Application;
use App\Controllers\HomeController;
use App\Controllers\Api\AccountsApiController;
use App\Controllers\Api\BusinessApiController;
use App\Controllers\Api\WarehouseApiController;
use App\Repositories\BusinessRepository;
use DafDb\Mysql\Context;
use App\Repositories\UsersRepository;
use App\Repositories\WarehouseRepository;
use App\Services\JwtService;

//{using}

date_default_timezone_set("Asia/Jerusalem");
$app = new Application();

$app->router->use($app->cors());

//$app->services->addSingleton(Context::class, fn() => new Context("doron_melaket","doron_melaket","melaket123"));
$app->services->addSingleton(Context::class, fn() => new Context("melaket","root",""));
$app->services->addSingleton(BusinessRepository::class, fn($x) => new BusinessRepository($x->getService(Context::class)));
$app->services->addSingleton(WarehouseRepository::class, fn($x) => new WarehouseRepository($x->getService(Context::class)));
$app->services->addSingleton(UsersRepository::class, fn($x) => new UsersRepository($x->getService(Context::class)));
$app->services->addSingleton(JwtService::class, fn()=> new JwtService("bnextsecretkeyhahahalololeden", "HS256"));

$app->router->addController(HomeController::class);
$app->router->addController(AccountsApiController::class);
$app->router->addController(BusinessApiController::class);
$app->router->addController(WarehouseApiController::class);
//{controllers}

try {
    $app->run();
} catch (\Throwable $th) {
    echo $th->getMessage();
}
?>