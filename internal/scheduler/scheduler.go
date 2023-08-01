package scheduler

import (
	"log"
	"context"
	"fmt"
	"time"
	"sync"
	
	"github.com/reugn/go-quartz/quartz"
)

type JobDescription struct {
	Id int
	Run_at time.Time
}


var once sync.Once
type singleton struct {
	scheduler quartz.Scheduler
	jobId int
	context context.Context
}

var (
	instance singleton
)

func Scheduler() singleton {

	once.Do(func() { // <-- atomic, does not allow repeating
		sched := quartz.NewStdScheduler()
		instance = singleton{sched, 0, nil} // <-- thread safe
	})

	return instance
}

func Init(ctx context.Context) {
	instance.context = ctx
	instance.scheduler.Start(ctx)
}

func Schedule(minutes time.Duration, comm string) (JobDescription, error) {
	if (minutes < time.Duration(0) || minutes > time.Duration(1440) * time.Minute) {
		return JobDescription{}, fmt.Errorf("Invalid value for scheduling minutes")
	}

	if (instance.jobId != 0) {
		instance.scheduler.DeleteJob(instance.jobId)
		instance.jobId = 0
	}
	
	job := CommandJob{comm}
	instance.jobId = job.Key()
	instance.scheduler.ScheduleJob(instance.context, &job, quartz.NewRunOnceTrigger(minutes))
	
	log.Printf("Job scheduled in %d minutes", minutes / time.Minute)
	return JobDescription{job.Key(), time.Now().Add(minutes)}, nil
}

func GetJob() JobDescription {
	if instance.jobId == 0 {
		return JobDescription{}
	} else {
		job, _ := instance.scheduler.GetScheduledJob(instance.jobId)
		log.Println(job)
		log.Println(job.NextRunTime)
		return JobDescription{instance.jobId, time.Unix(0, job.NextRunTime)}
	}
}

func Clear() {
	instance.scheduler.Clear()
}

func Stop() {
	instance.scheduler.Stop()
}