<?php 
namespace App\Repositories;

use DafDb as a;
use DafDb\Mysql\Repository;

use App\Models\CodeBinaBusinessProfile;

#[a\Table(model:CodeBinaBusinessProfile::class)]
class CodeBinaBusinessProfilesRepository extends Repository {

}
?>