package scheduler

import (
	"log"
	"context"
	"github.com/rittme/clim-control/internal/command"
	"github.com/reugn/go-quartz/quartz"
)

// CommandJob implements the quartz.Job interface.
type CommandJob struct {
	command string
}

// Description returns the description of the CommandJob.
func (cj *CommandJob) Description() string {
	return "Command " + cj.command
}


func (cj *CommandJob) Command() string {
	return cj.command
}


// Key returns the unique CommandJob key.
func (cj *CommandJob) Key() int {
	return quartz.HashCode(cj.Command())
}

// Execute is called by a Scheduler when the Trigger associated with this job fires.
func (cj *CommandJob) Execute(_ context.Context) {
	log.Printf("Running job %d: command %s", cj.Key(), cj.Command())
	command.Exec(cj.Command())
}