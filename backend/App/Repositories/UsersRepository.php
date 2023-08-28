<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\User;

#[a\Table(model:User::class)]
class UsersRepository extends Repository {
    function getLastInserted(bool $cast_to_model = true){
        return $this->include("business")->where("id", "=", $this->lastInsertId())->single($cast_to_model);
    }
}
?>