<?php 
namespace App\Services;

use App\Repositories\BusinessRepository;
use App\Repositories\CheetahRepository;
use App\Repositories\CodebinaDataRepository;
use App\Repositories\KonimboDataRepository;

class BackgroundDataService {
    function __construct(
        public BusinessRepository $brepo,
        public KonimboDataRepository $krepo,
        public CodebinaDataRepository $cbrepo,
        public CheetahRepository $cheetachRepo,
    ) {}

    public function getBusiness(int $businessId){
        $obj = new \stdClass();
        $obj->konimbo = $this->krepo->where("businessId", "=", $businessId)->many();
        $obj->codeBina = $this->cbrepo->where("businessId", "=", $businessId)->many();
        $obj->cheetah = $this->getCheetah();

        return $obj;
    }

    public function getCheetah(){
        return $this->cheetachRepo->many();
    }

    public function loadBusiness(int $businessId)
    {
        $this->loadKonimboData($businessId);
        $this->loadCodebinaData($businessId);
    }


    public function loadCheetah(int $businessId)
    {
        $b = $this->brepo
            ->include("models")
            ->where("id", "=", $businessId)
            ->single();

        $model = array_filter($b->models, function ($item) {
            return $item->name === "קונימבו";
        });

        if (!count($model)) {
            return;
        }
        $model = $model[0];

        try {

            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_TIMEOUT => 600,
                CURLOPT_CONNECTTIMEOUT => 0,
                CURLOPT_URL => "https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ws_spotslist&ARGUMENTS=-Aall",
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_HTTPHEADER => array("Authorization: Bearer " . $model->data->shippingToken),
                CURLOPT_SSL_VERIFYHOST => false,
                CURLOPT_SSL_VERIFYPEER => false
            ]);

            $data = curl_exec($ch);
            curl_close($ch);

        } catch (\Throwable $th) {
            throw new \Exception($th->getMessage());
        }

        $this->cheetachRepo->truncateTable();

        $xml = simplexml_load_string($data, "SimpleXMLElement", LIBXML_NOCDATA);

        $data = json_decode(json_encode($xml), true);
        foreach ($data['spots']['spot_detail'] as $spot => $info) {
            @$temp_spot = [
                "lockerCode" => intval($info['n_code']),
                "lockerCity" => $info['city'],
                "lockerText" => "{$info['city']}: {$info['name']} ({$info['street']} {$info['house']} - {$info['remarks']})"
            ];

            try {
                $this->cheetachRepo->insert($temp_spot)->execute();
            } catch (\Throwable $th) {
            }
        }


        ////////////////
        /*$data = @file_get_contents("https://chita-il.com/RunCom.Server/Request.aspx?APPNAME=run&PRGNAME=ws_spotslist&ARGUMENTS=-Aall");
        if ($data === false) {
            throw new \Exception("error in get data");
        }
        $this->cheetachRepo->truncateTable();

        $xml = simplexml_load_string($data, "SimpleXMLElement", LIBXML_NOCDATA);

        $data = json_decode(json_encode($xml), true);
        foreach ($data['spots']['spot_detail'] as $spot => $info) {
            @$temp_spot = [
                "lockerCode" => intval($info['n_code']),
                "lockerCity" => $info['city'],
                "lockerText" => "{$info['city']}: {$info['name']} ({$info['street']} {$info['house']} - {$info['remarks']})"
            ];

            try {
                $this->cheetachRepo->insert($temp_spot)->execute();
            } catch (\Throwable $th) {
            }
        }*/
    }

    public function getKonimboOrders(int $businessId, string $orderStatus)
    {
        $b = $this->brepo
            ->include("models")
            ->where("id", "=", $businessId)
            ->single();

        $model = array_filter($b->models, function ($item) {
            return $item->name === "קונימבו";
        });


        if (!count($model)) {
            return;
        }

        $model = $model[0];

        $baseURL = "https://api.konimbo.co.il/v1/orders?token=".trim($model->data->orderToken)."&status_option_title=".$orderStatus;

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $baseURL, 
            CURLOPT_NOBODY => 1,
            CURLOPT_RETURNTRANSFER => true, 
            CURLOPT_HTTPHEADER => ['Access-Control-Allow-Origin: *','Content-Type: application/json'],
            CURLOPT_POST => 0, 
            CURLOPT_HEADER => 1, 
            CURLOPT_FOLLOWLOCATION => 1, 
            CURLOPT_SSL_VERIFYHOST => FALSE, 
            CURLOPT_SSL_VERIFYPEER => FALSE
        ]);

        $data = curl_exec($ch);
        if ($data === false) {
            curl_close($ch);
            throw new \Exception("error in get data");
        }

        $header = preg_split('/\r?\n/', preg_split('/(\r?\n){2}/', $data, 2)[0]);
        $header = array_map(function($h) { return preg_split('/:\s{1,}/', $h, 2); }, $header);
        foreach($header as $i=>$h) {
            if(strpos($h[0], 'x-pag') !== 0) {  unset($header[$i]); continue; }
            $header[strtolower($h[0])] = isset($h[1]) ? $h[1] : $h[0];
            unset($header[$i]);
        }

        $count = (int) ceil($header['x-pagination-total']/$header['x-pagination-per-page']);

        if($header['x-pagination-total'] == 0) {
            curl_close($ch);
            return [];
        }

        $data = [];
        $model = array(
            "id","name","phone","address","shipping","cart_id","external_shipping_hash","note","discounts","payment_status","credit_card_details","shipping","additional_inputs","items","statuses","status_option_title","total_price","email"
        );

        for ($x = 1; $x <= $count; $x++) {
            curl_setopt_array($ch, [CURLOPT_HEADER => 0, CURLOPT_NOBODY => 0, CURLOPT_URL => "$baseURL&page=$x&attributes=".implode(",", $model)]);
            $orders = json_decode(curl_exec($ch), true);
            /*if(isset($orders['error'])) {
                $error = @file_get_contents('./App/JsonData/konimbo-errors.txt');
                $error = '['.date('d/m/Y H:i:s').'] '.json_encode($orders['error']).' for url: ('.$baseURL."&page=$x".')\r\n';
                file_put_contents('./App/JsonData/konimbo-errors.txt', $error);
                continue;
            }*/

            if(isset($orders['error'])) continue;
              
            foreach ($orders as $order) {
                /* Calling the order data_record_var seperatly - because of Konimbo Db Error */
                $baseIdURL = str_replace("/orders", "/orders/".$order['id'], $baseURL);
                curl_setopt_array($ch, [CURLOPT_HEADER => 0, CURLOPT_NOBODY => 0, CURLOPT_URL => "$baseIdURL&attributes=data_record_var"]);
                $response = json_decode(curl_exec($ch), true);
                $order['data_record_var'] = isset($response['data_record_var']) ? $response['data_record_var'] : [];        
                /* End of calling */        
                if (is_string(@$order['items'])) {
                    $order['items'] = str_replace('"delivery_time"=>nil,', '', $order['items']);
                    $order['items'] = str_replace('"dad_id"=>nil,', '', $order['items']);
                    $order['items'] = str_replace(' "var"=>{},', '', $order['items']);
                    $order['items'] = str_replace('"compatible"=>nil,', '', $order['items']);
                    $order['items'] = str_replace(', "compatible"=>nil', '', $order['items']);
                    $order['items'] = str_replace('"code":nil,', '', $order['items']);
                    $order['items'] = str_replace('=>#' , '=>"#', $order['items']);
                    $order['items'] = str_replace('>,' , '>",', $order['items']);
                    $order['items'] = explode('}, {:', $order['items'])[0].'}]';
                    $order['items'] = str_replace('=>' , ':', $order['items']);
                    $order['items'] = json_decode($order['items'], true);
                    foreach($order['items'] as $i=>$item_data)
                    {
                        $real_price = number_format(floatval(explode("'", $order['items'][$i]['price'])[1]), 2, '.', '');
                        $real_unit_price = number_format(floatval(explode("'", $order['items'][$i]['unit_price'])[1]), 2, '.', '');
                        $order['items'][$i]['price'] = $real_price;
                        $order['items'][$i]['unit_price'] = $real_unit_price;
                    }
                    $order['items'][] = array("type" => "shipping"); // Creating fake shipping item for the counter
                }
                $data[] = $order;
            }
        }
        
        curl_close($ch);
        return $data;
    }

    private function loadKonimboData(int $businessId)
    {
        $b = $this->brepo
            ->include("models")
            ->where("id", "=", $businessId)
            ->single();

        $model = array_filter($b->models, function ($item) {
            return $item->name === "קונימבו";
        });

        if (!count($model)) {
            return;
        }
        $model = $model[0];

        $baseURL = "https://api.konimbo.co.il/v1/items?token={$model->data->itemsToken}&attributes=id,price,second_code,images";

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $baseURL, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => ['Access-Control-Allow-Origin: *', 'Content-Type: application/json'],
            CURLOPT_POST => 0, CURLOPT_HEADER => 1, CURLOPT_FOLLOWLOCATION => 1, CURLOPT_SSL_VERIFYHOST => FALSE, CURLOPT_SSL_VERIFYPEER => FALSE
        ]);

        $data = curl_exec($ch);
        if ($data === false) {
            curl_close($ch);
            throw new \Exception("error in get data");
        }

        $header = preg_split('/\r?\n/', preg_split('/(\r?\n){2}/', $data, 2)[0]);
        $header = array_map(function ($h) {
            return preg_split('/:\s{1,}/', $h, 2);
        }, $header);
        foreach ($header as $i => $h) {
            if (strpos($h[0], 'x-pag') !== 0) {
                unset($header[$i]);
                continue;
            }
            $header[strtolower($h[0])] = isset($h[1]) ? $h[1] : $h[0];
            unset($header[$i]);
        }
        $count = (($header['x-pagination-total'] / $header['x-pagination-per-page']) + 1);

        if ($header['x-pagination-total'] == 0) {
            curl_close($ch);
            return;
        }

        for ($x = 1; $x <= $count; $x++) {
            curl_setopt_array($ch, [CURLOPT_HEADER => 0, CURLOPT_URL => "$baseURL&page=$x"]);
            $items = json_decode(curl_exec($ch), true);
            foreach ($items as $item) {
                $item['image'] = isset($item['images'][0]['url']) ? $item['images'][0]['url'] : '';
                unset($item['images']);
                $item['businessId'] = $businessId;
                $item['price'] = floatval($item['price']);

                try {
                    if ($this->krepo->where("id", "=", $item['id'])->where("businessId", "=", $businessId)->exists()) {
                        $this->krepo->update($item)
                            ->where("id", "=", $item['id'])
                            ->where("businessId", "=", $businessId)
                            ->execute();
                    } else {
                        $this->krepo->insert($item)->execute();
                    }
                } catch (\Throwable $th) {}
            }
        }

        curl_close($ch);
    }

    private function loadCodebinaData(int $businessId)
    {
        $b = $this->brepo
            ->include("codeBina")
            ->where("id", "=", $businessId)
            ->single();

        $authKey = base64_encode($b->codeBina->user . ":" . $b->codeBina->password);
        $port = explode(":", $b->codeBina->host)[1];

        $stocksData = $this->getCodebinaStocks($b->codeBina->host, $port, $authKey);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_PORT => $port,
            CURLOPT_URL => $b->codeBina->host . "/Codebina.svc/GetRest/ItemsIndex?fromDate=01/01/1999",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => [
                "Authorization: Basic {$authKey}",
            ]
        ]);

        $data = curl_exec($ch);
        if ($data === false) {
            curl_close($ch);
            throw new \Exception("error in get data");
        }

        $response = json_decode($data, true);
        curl_close($ch);

        foreach ($response as $i => $line) {
            $data = array(
                'ItemNo' => $line['ItemNo'],
                'businessId' => $businessId,
                'Barcode' => $line['Barcode'],
                'SalePrice' => $line['SalePrice'],
                'WareHousePos' => $line['WareHousePos'],
                'Stock' => isset($stocksData[$line['ItemNo']]) ? $stocksData[$line['ItemNo']] : []
            );

            $data['Stock'] = json_encode($data['Stock']);

            try {
                if ($this->cbrepo->where("ItemNo", "=", $data['ItemNo'])->where("businessId", "=", $businessId)->exists()) {
                    $this->cbrepo->update($data)
                        ->where("ItemNo", "=", $data['ItemNo'])
                        ->where("businessId", "=", $businessId)
                        ->execute();
                } else {
                    $this->cbrepo->insert($data)->execute();
                }
            } catch (\Throwable $th) {
            }
        }
    }

    private function getCodebinaStocks(string $host, string $port, string $authKey): array
    {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_PORT => $port,
            CURLOPT_URL => $host . "/Codebina.svc/GetRest/Inventory",
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_ENCODING => "",
            CURLOPT_MAXREDIRS => 10,
            CURLOPT_TIMEOUT => 120,
            CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
            CURLOPT_CUSTOMREQUEST => "GET",
            CURLOPT_HTTPHEADER => [
                "Authorization: Basic {$authKey}",
            ]
        ]);
        $stockData = [];

        $data = curl_exec($ch);
        if ($data === false) {
            curl_close($ch);
            throw new \Exception("error in get data");
        }
        $response = json_decode($data, true);

        foreach ($response as $item) {
            $stockData[$item['ItemNo']][] = array(
                'warehouseId' => $item['Warehouse'],
                'amount' => $item['InventoryIn'] - $item['InventoryOut']
            );
        }
        curl_close($ch);

        return $stockData;
    }
}
?>