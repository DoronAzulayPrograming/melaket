<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\UserWarehouse;

#[a\Table(model:UserWarehouse::class)]
class UsersWarehousesRepository extends Repository {

}
?>