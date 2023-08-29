<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\User;
use DafDb\Mysql\Context;

#[a\Table(model:User::class)]
class UsersRepository extends Repository {
    
    public function __construct(Context $context)
    {
        parent::__construct($context);

        if(!$this->existsWhere("id", "=", "1")){
            $pass = '$2y$10$tT3T/KbS32W5d5XWK.b3jeP/B3nroeHDKWffZiU68/fpofBes4zTi';
            $this->customQuery("INSERT INTO `users`(`id`, `businessId`, `name`, `email`, `password`, `roles`, `createDate`) VALUES ('1','1','אביעד','badmin@admin.org','$pass','admin','2023-08-28')");
        }
    }

    function getLastInserted(bool $cast_to_model = true){
        return $this->include("business")->where("id", "=", $this->lastInsertId())->single($cast_to_model);
    }
}
?>