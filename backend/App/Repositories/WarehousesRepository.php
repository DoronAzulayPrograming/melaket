<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\Warehouse;

#[a\Table(model:Warehouse::class)]
class WarehousesRepository extends Repository {
    function getLastInserted(){
        return $this->include("business")->where("id", "=", $this->lastInsertId())->single();
    }
}
?>