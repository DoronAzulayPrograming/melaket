<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\Model\Model;

#[a\Table(model:Model::class)]
class ModelsRepository extends Repository {

    function getLastInserted(bool $cast_to_model = true){
        return $this->include("business")->where("id", "=", $this->lastInsertId())->single($cast_to_model);
    }
}
?>