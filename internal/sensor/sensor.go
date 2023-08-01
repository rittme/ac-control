package sensor

import (
	"fmt"
	
	"github.com/parMaster/htu21"
	"periph.io/x/conn/v3/i2c/i2creg"
	"periph.io/x/conn/v3/physic"
	"periph.io/x/host/v3"
)

var (
	htu21Data   physic.Env
	htu21Device *htu21.Dev
)

type Readings struct {
	Temperature string
	Humidity string
}

func Read() (Readings, error) {
	empty := Readings{
		"N/A",
		"N/A",
	}
	
	// Preparing to read sensor
	if _, err := host.Init(); err != nil {
		// log.Fatal(err)
		return empty, err
	}

	// Use i2creg I²C bus registry to find the first available I²C bus.
	b, err := i2creg.Open("1")
	if err != nil {
		// log.Fatalf("failed to open I²C: %v", err)
		return empty, fmt.Errorf("Failed to open I²C: %v", err)
	}
	defer b.Close()

	htu21Device, err = htu21.NewI2C(b, 0x40)
	if err != nil {
		//log.Fatalf("failed to initialize htu21: %v", err)
		return empty, fmt.Errorf("Failed to initialize htu21: %v", err)
	}

	if err := htu21Device.Sense(&htu21Data); err != nil {
		//log.Fatal(err)
		return empty, err
	}
	// That's it!

	return Readings{
		fmt.Sprintf("%.2f", htu21Data.Temperature.Celsius()),
		fmt.Sprintf("%d", htu21Data.Humidity / physic.PercentRH),
	}, nil
}
