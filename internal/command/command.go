package command

import (
	"log"
	"os/exec"
)

func Exec(comm string) bool {
	// create a new *Cmd instance
	// here we pass the command as the first argument and the arguments to pass to the command as the
	// remaining arguments in the function
	cmd := exec.Command("irsend", "SEND_ONCE", "acmitsubishi", comm)

	// The `Output` method executes the command and
	// collects the output, returning its value
	err := cmd.Run()
	if err != nil {
		// if there was any error, print it here
		log.Println("could not run command: ", err)
		return false
	}
	
	return true
}
