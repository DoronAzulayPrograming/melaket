<?php 
namespace App\Services;

class InvoicesService {

    function __construct(
        public string $basePath
    ) {}

    function save(int $businessId, $obj)
    {
        try {
            $folder_path = $this->basePath . "/" . $businessId . "/konimbo";
            if (!file_exists($folder_path)) {
                mkdir($folder_path);
            }

            $file_path = $folder_path . "/" . $obj->invoiceNo . ".json";
            file_put_contents($file_path, json_encode($obj->data));
        } catch (\Throwable $th) {
            return false;
        }
        return true;
    }

    function load(int $businessId, int $invoiceNumber)
    {
        $file_path = $this->basePath . "/" . $businessId . "/konimbo/" . $invoiceNumber . ".json";
        if (!file_exists($file_path)) {
            return null;
        }
        $json = file_get_contents($file_path);
        return json_decode($json, true);
    }
}
?>