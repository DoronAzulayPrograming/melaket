<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\BackgroundData\KonimboModel;

#[a\Table(model:KonimboModel::class)]
class KonimboDataRepository extends Repository {

}
?>