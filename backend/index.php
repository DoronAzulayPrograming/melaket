<?php
namespace App;

require_once("./vendor/sendgrid/sendgrid-php.php");
require_once "./vendor/autoloader.php";

use DafCore\Application;
use App\Controllers\HomeController;
use App\Controllers\Api\AccountsApiController;
use App\Controllers\Api\BusinessApiController;
use App\Controllers\Api\CheetahApiController;
use App\Controllers\Api\WarehousesApiController;
use App\Repositories\BusinessRepository;
use App\Repositories\ModelsRepository;
use DafDb\Mysql\Context;
use App\Repositories\UsersRepository;
use App\Services\JwtService;
use App\Data\Cipher;

use App\Controllers\Api\ModelsApiController;
use App\Repositories\CodeBinaBusinessProfilesRepository;
use App\Controllers\Api\CodeBinaBusinessProfilesApiController;
use App\Repositories\UsersWarehousesRepository;
use App\Repositories\WarehousesRepository;

use App\Controllers\Api\UsersWarehousesApiController;
use App\Repositories\CheetahRepository;
use App\Repositories\CodebinaDataRepository;
use App\Repositories\KonimboDataRepository;
use App\Services\BackgroundDataService;
use App\Services\InvoicesService;

use App\Controllers\Api\KonimboApiController;
use App\Controllers\InvoicesController;
use App\Controllers\JsPrintManagerController;
//{using}

class GlobalRoles {
    static string $admin;
    static string $subAdmin;
    static string $manager;
    static string $member;

    static array $roles = [
        "admin",
        "subAdmin",
        "manager",
        "member"
    ];
}


// $d = new Cipher("melaket-eden-doron");
// echo $d->encrypt("32,12086");

date_default_timezone_set("Asia/Jerusalem");
$app = new Application();

$app->router->use($app->cors());

//$app->services->addSingleton(Context::class, fn() => new Context("doron_melaket","doron_melaket","melaket123"));
$app->services->addSingleton(Context::class, fn() => new Context("melaket","root",""));

$app->services->addSingleton(InvoicesService::class, fn() => new InvoicesService("public/invoices"));
$app->services->addSingleton(Cipher::class, fn() => new Cipher("melaket-eden-doron"));

$app->services->addSingleton(BusinessRepository::class, fn($x) => new BusinessRepository($x->getService(Context::class)));
$app->services->addSingleton(CodeBinaBusinessProfilesRepository::class, fn($x) => new CodeBinaBusinessProfilesRepository($x->getService(Context::class)));
$app->services->addSingleton(ModelsRepository::class, fn($x) => new ModelsRepository($x->getService(Context::class)));
$app->services->addSingleton(WarehousesRepository::class, fn($x) => new WarehousesRepository($x->getService(Context::class)));
$app->services->addSingleton(UsersRepository::class, fn($x) => new UsersRepository($x->getService(Context::class)));
$app->services->addSingleton(UsersWarehousesRepository::class, fn($x) => new UsersWarehousesRepository($x->getService(Context::class)));
$app->services->addSingleton(JwtService::class, fn()=> new JwtService("bnextsecretkeyhahahalololeden", "HS256"));

$app->services->addSingleton(CheetahRepository::class, fn($x) => new CheetahRepository($x->getService(Context::class)));
$app->services->addSingleton(KonimboDataRepository::class, fn($x) => new KonimboDataRepository($x->getService(Context::class)));
$app->services->addSingleton(CodebinaDataRepository::class, fn($x) => new CodebinaDataRepository($x->getService(Context::class)));
$app->services->addSingleton(BackgroundDataService::class, fn($x) => new BackgroundDataService(
    $x->getService(BusinessRepository::class),
    $x->getService(KonimboDataRepository::class),
    $x->getService(CodebinaDataRepository::class),
    $x->getService(CheetahRepository::class)
));

$app->router->addController(HomeController::class);
$app->router->addController(AccountsApiController::class);
$app->router->addController(BusinessApiController::class);
$app->router->addController(WarehousesApiController::class);
$app->router->addController(ModelsApiController::class);
$app->router->addController(CodeBinaBusinessProfilesApiController::class);
$app->router->addController(UsersWarehousesApiController::class);
$app->router->addController(KonimboApiController::class);
$app->router->addController(CheetahApiController::class);
$app->router->addController(InvoicesController::class);
$app->router->addController(JsPrintManagerController::class);
//{controllers}

try {
    $app->run();
} catch (\Throwable $th) {
    echo $th->getMessage();
}
?>